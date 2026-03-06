"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'category' | 'updated_at';
type SortDir = 'asc' | 'desc';

const CATEGORIES = [
  'All',
  'Welcome',
  'Verification',
  'Reset Password',
  'Notification',
  'Marketing',
  'Subscription',
  'Team',
  'Report',
];

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

interface TemplateListProps {
  templates: EmailTemplate[];
  loading?: boolean;
  onEdit?: (template: EmailTemplate) => void;
  onDuplicate?: (template: EmailTemplate) => void;
  onDelete?: (template: EmailTemplate) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function templatesToCsv(templates: EmailTemplate[]): string {
  const headers = ['Name', 'Subject', 'Category', 'Description', 'Created', 'Updated'];
  const rows = templates.map((t) => [
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.subject.replace(/"/g, '""')}"`,
    t.category,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.created_at,
    t.updated_at,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function TemplateList({ templates, loading, onEdit, onDuplicate, onDelete }: TemplateListProps) {
  const [search, setSearch] = useState(() => getUrlParam('tq', ''));
  const [category, setCategory] = useState(() => getUrlParam('cat', 'All'));
  const [sortField, setSortField] = useState<SortField>(() => getUrlParam('tsort', 'name') as SortField);
  const [sortDir, setSortDir] = useState<SortDir>(() => getUrlParam('tdir', 'asc') as SortDir);
  const [page, setPage] = useState(() => parseInt(getUrlParam('tpage', '1'), 10) || 1);
  const [deleteConfirm, setDeleteConfirm] = useState<EmailTemplate | null>(null);
  const pageSize = 25;

  useEffect(() => {
    setUrlParams({
      tq: search || '',
      cat: category !== 'All' ? category : '',
      tsort: sortField !== 'name' ? sortField : '',
      tdir: sortDir !== 'asc' ? sortDir : '',
      tpage: page > 1 ? String(page) : '',
    });
  }, [search, category, sortField, sortDir, page]);

  const filtered = useMemo(() => {
    let result = [...templates];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') {
      result = result.filter((t) => t.category === category);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [templates, search, category, sortField, sortDir]);

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

  const handleExport = useCallback(() => {
    const csv = templatesToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-templates.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '\u2191' : '\u2193') : '\u2195'}
    </span>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Templates ({filtered.length})
        </h3>
        <div className="flex-1"></div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search templates..."
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-56"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">&#9993;</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No templates found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {search || category !== 'All' ? 'Try adjusting your filters' : 'No email templates have been created yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    onClick={() => toggleSort('name')}
                  >
                    Name <SortIcon field="name" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Subject</th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    onClick={() => toggleSort('category')}
                  >
                    Category <SortIcon field="category" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    onClick={() => toggleSort('updated_at')}
                  >
                    Updated <SortIcon field="updated_at" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                    onClick={() => onEdit?.(t)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400" title={formatFullDate(t.updated_at)}>
                      {formatRelativeTime(t.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDuplicate?.(t)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          title="Duplicate template"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(t)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          title="Delete template"
                        >
                          Delete
                        </button>
                      </div>
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Template</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(deleteConfirm);
                  setDeleteConfirm(null);
                }}
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
