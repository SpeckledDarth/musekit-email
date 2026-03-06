"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Campaign, CampaignRecipient, RecipientDeliveryStatus } from './types';
import { STATUS_COLORS, RECIPIENT_STATUS_COLORS } from './types';
import { formatRelativeTime, formatFullDate, describeAudience, writeAuditLog } from './utils';
import { emailWrapper } from '../templates/shared';

interface CampaignDetailProps {
  campaign: Campaign;
  recipients?: CampaignRecipient[];
  recipientsLoading?: boolean;
  loading?: boolean;
  onBack?: () => void;
  onDuplicate?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
  brandSettings?: {
    appName?: string;
    primaryColor?: string;
    supportEmail?: string;
    websiteUrl?: string;
  };
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

function MetricCard({ label, value, subtext }: MetricCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>}
    </div>
  );
}

export function CampaignDetail({
  campaign,
  recipients,
  recipientsLoading,
  loading,
  onBack,
  onDuplicate,
  onDelete,
  brandSettings,
}: CampaignDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<'all' | RecipientDeliveryStatus>('all');
  const [recipientPage, setRecipientPage] = useState(1);
  const recipientPageSize = 25;

  const previewHtml = useMemo(() => {
    const brand = {
      appName: brandSettings?.appName || 'MuseKit',
      primaryColor: brandSettings?.primaryColor || '#3b6cff',
      supportEmail: brandSettings?.supportEmail || 'support@musekit.app',
      websiteUrl: brandSettings?.websiteUrl || 'https://musekit.app',
    };
    return emailWrapper(campaign.body, brand);
  }, [campaign.body, brandSettings]);

  const filteredRecipients = useMemo(() => {
    if (!recipients) return [];
    let result = [...recipients];
    if (recipientSearch) {
      const q = recipientSearch.toLowerCase();
      result = result.filter((r) => r.email.toLowerCase().includes(q) || (r.name && r.name.toLowerCase().includes(q)));
    }
    if (recipientStatusFilter !== 'all') {
      result = result.filter((r) => r.status === recipientStatusFilter);
    }
    return result;
  }, [recipients, recipientSearch, recipientStatusFilter]);

  const recipientTotalPages = Math.max(1, Math.ceil(filteredRecipients.length / recipientPageSize));
  useEffect(() => {
    if (recipientPage > recipientTotalPages) setRecipientPage(recipientTotalPages);
    else if (recipientPage < 1) setRecipientPage(1);
  }, [recipientPage, recipientTotalPages]);
  const clampedRecipientPage = Math.max(1, Math.min(recipientPage, recipientTotalPages));
  const paginatedRecipients = filteredRecipients.slice((clampedRecipientPage - 1) * recipientPageSize, clampedRecipientPage * recipientPageSize);

  const colors = STATUS_COLORS[campaign.status];
  const deliveredCount = Math.max(0, campaign.sent_count - campaign.bounce_count);
  const openedCount = Math.round((campaign.open_rate / 100) * deliveredCount);
  const clickedCount = Math.round((campaign.click_rate / 100) * deliveredCount);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            &larr; Campaigns
          </button>
        )}
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm text-gray-900 dark:text-white font-medium">{campaign.name}</span>
      </div>

      {toast && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 text-sm text-green-700 dark:text-green-300">
          {toast}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.name}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Subject: {campaign.subject}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              From: {campaign.from_name} {campaign.reply_to && `• Reply-to: ${campaign.reply_to}`}
            </p>
          </div>
          <div className="flex gap-2">
            {onDuplicate && (
              <button
                onClick={() => {
                  onDuplicate(campaign);
                  writeAuditLog({ action: 'campaign.duplicated', entity_type: 'campaign', entity_id: campaign.id, metadata: { name: campaign.name } });
                  setToast('Campaign duplicated');
                  setTimeout(() => setToast(''), 3000);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Duplicate
              </button>
            )}
            {onDelete && campaign.status === 'draft' && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Sent" value={campaign.sent_count.toLocaleString()} />
            <MetricCard label="Delivered" value={deliveredCount.toLocaleString()} subtext={campaign.sent_count > 0 ? `${Math.round((deliveredCount / campaign.sent_count) * 100)}%` : undefined} />
            <MetricCard label="Opened" value={openedCount.toLocaleString()} subtext={`${campaign.open_rate}%`} />
            <MetricCard label="Clicked" value={clickedCount.toLocaleString()} subtext={`${campaign.click_rate}%`} />
            <MetricCard label="Bounced" value={campaign.bounce_count.toLocaleString()} />
            <MetricCard label="Unsubscribed" value={campaign.unsubscribe_count.toLocaleString()} />
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Audience</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{describeAudience(campaign.audience)}</p>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <span className="text-gray-700 dark:text-gray-300" title={formatFullDate(campaign.created_at)}>
                {formatRelativeTime(campaign.created_at)}
              </span>
            </div>
            {campaign.scheduled_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
                <span className="text-gray-700 dark:text-gray-300" title={formatFullDate(campaign.scheduled_at)}>
                  {formatFullDate(campaign.scheduled_at)}
                </span>
              </div>
            )}
            {campaign.sent_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-gray-500 dark:text-gray-400">Sent</span>
                <span className="text-gray-700 dark:text-gray-300" title={formatFullDate(campaign.sent_at)}>
                  {formatRelativeTime(campaign.sent_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {(recipients || recipientsLoading) && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Recipients {recipients ? `(${filteredRecipients.length})` : ''}
              </h3>
              <div className="flex-1"></div>
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => { setRecipientSearch(e.target.value); setRecipientPage(1); }}
                placeholder="Search by email or name..."
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-48"
              />
              <select
                value={recipientStatusFilter}
                onChange={(e) => { setRecipientStatusFilter(e.target.value as 'all' | RecipientDeliveryStatus); setRecipientPage(1); }}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="bounced">Bounced</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
            {recipientsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredRecipients.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                {recipientSearch || recipientStatusFilter !== 'all' ? 'No recipients match your filters' : 'No recipient data available'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Delivered</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Opened</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Clicked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecipients.map((r) => {
                        const rc = RECIPIENT_STATUS_COLORS[r.status];
                        return (
                          <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">{r.email}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.name || '\u2014'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${rc.bg} ${rc.text} ${rc.darkBg} ${rc.darkText}`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                              {r.delivered_at ? <span title={formatFullDate(r.delivered_at)}>{formatRelativeTime(r.delivered_at)}</span> : '\u2014'}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                              {r.opened_at ? <span title={formatFullDate(r.opened_at)}>{formatRelativeTime(r.opened_at)}</span> : '\u2014'}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                              {r.clicked_at ? <span title={formatFullDate(r.clicked_at)}>{formatRelativeTime(r.clicked_at)}</span> : '\u2014'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {recipientTotalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Page {clampedRecipientPage} of {recipientTotalPages}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                        disabled={recipientPage === 1}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setRecipientPage((p) => Math.min(recipientTotalPages, p + 1))}
                        disabled={recipientPage === recipientTotalPages}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Email Preview</h3>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <iframe
              srcDoc={previewHtml}
              title="Campaign Email Preview"
              className="w-full border-0"
              style={{ height: '500px' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Campaign</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{campaign.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(campaign);
                  writeAuditLog({ action: 'campaign.deleted', entity_type: 'campaign', entity_id: campaign.id, metadata: { name: campaign.name, subject: campaign.subject } });
                  setDeleteConfirm(false);
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
