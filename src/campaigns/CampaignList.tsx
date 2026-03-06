"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Campaign, CampaignStatus } from './types';
import { STATUS_COLORS } from './types';
import { formatRelativeTime, formatFullDate, campaignsToCsv, downloadCsv, writeAuditLog } from './utils';

type SortField = 'name' | 'subject' | 'status' | 'sent_count' | 'open_rate' | 'click_rate' | 'created_at' | 'sent_at';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | CampaignStatus;

function getUrlParam(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return new URLSearchParams(window.location.search).get(key) || fallback;
  } catch { return fallback; }
}

function setUrlParams(params: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

interface CampaignListProps {
  campaigns: Campaign[];
  loading?: boolean;
  onNewCampaign?: () => void;
  onSelectCampaign?: (campaign: Campaign) => void;
  onDeleteCampaigns?: (ids: string[]) => void;
}

export function CampaignList({
  campaigns,
  loading,
  onNewCampaign,
  onSelectCampaign,
  onDeleteCampaigns,
}: CampaignListProps) {
  const [search, setSearch] = useState(() => getUrlParam('q', ''));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => getUrlParam('status', 'all') as StatusFilter);
  const [sortField, setSortField] = useState<SortField>(() => getUrlParam('sort', 'created_at') as SortField);
  const [sortDir, setSortDir] = useState<SortDir>(() => getUrlParam('dir', 'desc') as SortDir);
  const [page, setPage] = useState(() => parseInt(getUrlParam('page', '1'), 10) || 1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    setUrlParams({
      q: search || '',
      status: statusFilter !== 'all' ? statusFilter : '',
      sort: sortField !== 'created_at' ? sortField : '',
      dir: sortDir !== 'desc' ? sortDir : '',
      page: page > 1 ? String(page) : '',
    });
  }, [search, statusFilter, sortField, sortDir, page]);

  const filtered = useMemo(() => {
    let result = [...campaigns];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'subject': cmp = a.subject.localeCompare(b.subject); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'sent_count': cmp = a.sent_count - b.sent_count; break;
        case 'open_rate': cmp = a.open_rate - b.open_rate; break;
        case 'click_rate': cmp = a.click_rate - b.click_rate; break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'sent_at':
          cmp = (a.sent_at ? new Date(a.sent_at).getTime() : 0) - (b.sent_at ? new Date(b.sent_at).getTime() : 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [campaigns, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    else if (page < 1) setPage(1);
  }, [page, totalPages]);
  const clampedPage = Math.max(1, Math.min(page, totalPages));
  const paginated = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }, [sortField]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((c) => c.id)));
    }
  }, [paginated, selected.size]);

  const handleExport = useCallback(() => {
    const csv = campaignsToCsv(filtered);
    downloadCsv(csv, 'campaigns.csv');
  }, [filtered]);

  const handleBulkDelete = useCallback(() => {
    if (onDeleteCampaigns && selected.size > 0) {
      const ids = Array.from(selected);
      onDeleteCampaigns(ids);
      for (const id of ids) {
        writeAuditLog({ action: 'campaign.deleted', entity_type: 'campaign', entity_id: id, metadata: { bulk: true } });
      }
      setSelected(new Set());
      setDeleteConfirm(false);
    }
  }, [onDeleteCampaigns, selected]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '\u2191' : '\u2193') : '\u2195'}
    </span>
  );

  const StatusBadge = ({ status }: { status: CampaignStatus }) => {
    const colors = STATUS_COLORS[status];
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
          <div className="flex-1"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Campaigns ({filtered.length})
        </h3>
        <div className="flex-1"></div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search campaigns..."
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Export CSV
        </button>
        {onNewCampaign && (
          <button
            onClick={onNewCampaign}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            New Campaign
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">&#128232;</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No campaigns found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first email campaign to get started'}
          </p>
          {onNewCampaign && !search && statusFilter === 'all' && (
            <button
              onClick={onNewCampaign}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Campaign
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  {([
                    ['name', 'Name'],
                    ['subject', 'Subject'],
                    ['status', 'Status'],
                    ['sent_count', 'Recipients'],
                    ['open_rate', 'Open Rate'],
                    ['click_rate', 'Click Rate'],
                    ['created_at', 'Created'],
                    ['sent_at', 'Sent Date'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none whitespace-nowrap"
                      onClick={() => toggleSort(field)}
                    >
                      {label} <SortIcon field={field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                    onClick={() => onSelectCampaign?.(c)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{c.subject}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.sent_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.open_rate}%</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.click_rate}%</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400" title={formatFullDate(c.created_at)}>
                      {formatRelativeTime(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {c.sent_at ? (
                        <span title={formatFullDate(c.sent_at)}>{formatRelativeTime(c.sent_at)}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {clampedPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm">{selected.size} campaign{selected.size > 1 ? 's' : ''} selected</span>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-3 py-1 text-sm bg-red-600 rounded hover:bg-red-700"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1 text-sm bg-gray-700 dark:bg-gray-600 rounded hover:bg-gray-600 dark:hover:bg-gray-500"
          >
            Clear
          </button>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Campaigns</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete {selected.size} campaign{selected.size > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
