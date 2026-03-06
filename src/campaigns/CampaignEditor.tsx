"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { CampaignFormData, AudienceType } from './types';
import { SUBSCRIPTION_TIERS, USER_STATUSES } from './types';
import { getAvailableVariables, replaceVariables } from '../variables';
import { emailWrapper } from '../templates/shared';
import { writeAuditLog } from './utils';

interface CampaignEditorProps {
  initialData?: Partial<CampaignFormData>;
  onSaveDraft?: (data: CampaignFormData) => void;
  onSchedule?: (data: CampaignFormData) => void;
  onSendNow?: (data: CampaignFormData, recipientCount: number) => void;
  onSendTest?: (html: string, toEmail: string) => void;
  onCancel?: () => void;
  estimateRecipients?: (audience: CampaignFormData['audience']) => number;
  brandSettings?: {
    appName?: string;
    primaryColor?: string;
    supportEmail?: string;
    websiteUrl?: string;
  };
}

interface FormErrors {
  name?: string;
  subject?: string;
  from_name?: string;
  body?: string;
  audience?: string;
  scheduled_at?: string;
}

export function CampaignEditor({
  initialData,
  onSaveDraft,
  onSchedule,
  onSendNow,
  onSendTest,
  onCancel,
  estimateRecipients,
  brandSettings,
}: CampaignEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [fromName, setFromName] = useState(initialData?.from_name || 'MuseKit');
  const [replyTo, setReplyTo] = useState(initialData?.reply_to || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [audienceType, setAudienceType] = useState<AudienceType>(initialData?.audience?.type || 'all');
  const [selectedTiers, setSelectedTiers] = useState<string[]>(initialData?.audience?.tiers || []);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialData?.audience?.statuses || []);
  const [dateStart, setDateStart] = useState(initialData?.audience?.dateRange?.start || '');
  const [dateEnd, setDateEnd] = useState(initialData?.audience?.dateRange?.end || '');
  const [customEmails, setCustomEmails] = useState(initialData?.audience?.customEmails?.join(', ') || '');
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduled_at || '');
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sendConfirm, setSendConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState('');
  const initialRef = useRef(false);

  useEffect(() => {
    if (initialRef.current) {
      setDirty(true);
    }
    initialRef.current = true;
  }, [name, subject, fromName, replyTo, body, audienceType, selectedTiers, selectedStatuses, dateStart, dateEnd, customEmails, scheduledAt]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const variables = useMemo(() => getAvailableVariables('welcome'), []);

  const sampleValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const v of variables) {
      vals[v.name] = v.defaultValue || `[${v.name}]`;
    }
    return vals;
  }, [variables]);

  const previewHtml = useMemo(() => {
    const replaced = replaceVariables(body, sampleValues);
    const brand = {
      appName: brandSettings?.appName || 'MuseKit',
      primaryColor: brandSettings?.primaryColor || '#3b6cff',
      supportEmail: brandSettings?.supportEmail || 'support@musekit.app',
      websiteUrl: brandSettings?.websiteUrl || 'https://musekit.app',
    };
    return emailWrapper(replaced, brand);
  }, [body, sampleValues, brandSettings]);

  const buildFormData = useCallback((): CampaignFormData => {
    const audience: CampaignFormData['audience'] = { type: audienceType };
    if (audienceType === 'tier') audience.tiers = selectedTiers;
    if (audienceType === 'status') audience.statuses = selectedStatuses;
    if (audienceType === 'date_range') audience.dateRange = { start: dateStart, end: dateEnd };
    if (audienceType === 'custom') {
      audience.customEmails = customEmails.split(',').map((e) => e.trim()).filter(Boolean);
    }
    return {
      name,
      subject,
      from_name: fromName,
      reply_to: replyTo,
      body,
      audience,
      scheduled_at: scheduledAt || null,
    };
  }, [name, subject, fromName, replyTo, body, audienceType, selectedTiers, selectedStatuses, dateStart, dateEnd, customEmails, scheduledAt]);

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Campaign name is required';
    if (!subject.trim()) errs.subject = 'Subject line is required';
    if (!fromName.trim()) errs.from_name = 'From name is required';
    if (!body.trim()) errs.body = 'Email body is required';
    if (audienceType === 'tier' && selectedTiers.length === 0) errs.audience = 'Select at least one tier';
    if (audienceType === 'status' && selectedStatuses.length === 0) errs.audience = 'Select at least one status';
    if (audienceType === 'date_range' && (!dateStart || !dateEnd)) errs.audience = 'Both start and end dates are required';
    if (audienceType === 'custom') {
      const emails = customEmails.split(',').map((e) => e.trim()).filter(Boolean);
      if (emails.length === 0) errs.audience = 'Enter at least one email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, subject, fromName, body, audienceType, selectedTiers, selectedStatuses, dateStart, dateEnd, customEmails]);

  const recipientCount = useMemo(() => {
    if (!estimateRecipients) {
      if (audienceType === 'custom') {
        return customEmails.split(',').map((e) => e.trim()).filter(Boolean).length;
      }
      return 0;
    }
    return estimateRecipients(buildFormData().audience);
  }, [estimateRecipients, audienceType, customEmails, buildFormData]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!validate()) return;
    const data = buildFormData();
    onSaveDraft?.(data);
    writeAuditLog({ action: 'campaign.draft_saved', entity_type: 'campaign', entity_id: '', metadata: { name: data.name, subject: data.subject } });
    setDirty(false);
    showToast('Draft saved');
  }, [validate, onSaveDraft, buildFormData, showToast]);

  const handleSchedule = useCallback(() => {
    if (!validate()) return;
    if (!scheduledAt) {
      setErrors((prev) => ({ ...prev, scheduled_at: 'Select a date and time' }));
      return;
    }
    const data = buildFormData();
    onSchedule?.(data);
    writeAuditLog({ action: 'campaign.scheduled', entity_type: 'campaign', entity_id: '', metadata: { name: data.name, subject: data.subject, scheduled_at: data.scheduled_at } });
    setDirty(false);
    showToast('Campaign scheduled');
  }, [validate, scheduledAt, onSchedule, buildFormData, showToast]);

  const handleSendNow = useCallback(() => {
    if (!validate()) return;
    setSendConfirm(true);
  }, [validate]);

  const confirmSend = useCallback(() => {
    const data = buildFormData();
    onSendNow?.(data, recipientCount);
    writeAuditLog({ action: 'campaign.sent', entity_type: 'campaign', entity_id: '', metadata: { name: data.name, subject: data.subject, recipient_count: recipientCount, audience: data.audience } });
    setDirty(false);
    setSendConfirm(false);
    showToast('Campaign sent');
  }, [onSendNow, buildFormData, recipientCount, showToast]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail || !onSendTest) return;
    setTestSending(true);
    try {
      await onSendTest(previewHtml, testEmail);
      showToast('Test email sent');
    } catch {
      showToast('Failed to send test');
    }
    setTestSending(false);
  }, [testEmail, onSendTest, previewHtml, showToast]);

  const insertVariable = useCallback((varName: string) => {
    setBody((prev) => prev + `{{${varName}}}`);
  }, []);

  const InputError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 dark:text-red-400 mt-1">{msg}</p> : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-750 rounded-t-lg">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={() => {
                if (dirty && !window.confirm('You have unsaved changes. Discard?')) return;
                onCancel();
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              &larr; Back
            </button>
          )}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {initialData?.name ? 'Edit Campaign' : 'New Campaign'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-sm text-green-600 dark:text-green-400 font-medium">{toast}</span>}
          <button onClick={handleSaveDraft} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            Save Draft
          </button>
          <button onClick={handleSchedule} className="px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
            Schedule
          </button>
          <button onClick={handleSendNow} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
            Send Now
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-1/2 overflow-y-auto border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. March Newsletter"
            />
            <InputError msg={errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject"
              />
              <InputError msg={errors.subject} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="MuseKit"
              />
              <InputError msg={errors.from_name} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reply-to Email</label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="reply@musekit.app"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
            <select
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as AudienceType)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
            >
              <option value="all">All Users</option>
              <option value="tier">By Subscription Tier</option>
              <option value="status">By User Status</option>
              <option value="date_range">By Signup Date Range</option>
              <option value="custom">Custom Email List</option>
            </select>

            {audienceType === 'tier' && (
              <div className="flex flex-wrap gap-2">
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <label key={tier} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTiers((p) => [...p, tier]);
                        else setSelectedTiers((p) => p.filter((t) => t !== tier));
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    {tier}
                  </label>
                ))}
              </div>
            )}

            {audienceType === 'status' && (
              <div className="flex flex-wrap gap-2">
                {USER_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStatuses((p) => [...p, status]);
                        else setSelectedStatuses((p) => p.filter((s) => s !== status));
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}

            {audienceType === 'date_range' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {audienceType === 'custom' && (
              <textarea
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                rows={3}
                placeholder="email1@example.com, email2@example.com"
              />
            )}
            <InputError msg={errors.audience} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Send (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <InputError msg={errors.scheduled_at} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Body</label>
            </div>
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    title={v.description}
                    className="px-2 py-0.5 text-xs rounded border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {`{{${v.name}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              rows={10}
              placeholder="Enter email HTML..."
            />
            <InputError msg={errors.body} />
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview</h4>
            {onSendTest && (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40"
                />
                <button
                  onClick={handleSendTest}
                  disabled={testSending || !testEmail}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {testSending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
            <iframe
              srcDoc={previewHtml}
              title="Campaign Preview"
              className="w-full h-full border-0 bg-white rounded shadow-sm"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      {sendConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Send Campaign Now?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will send &quot;{subject || 'Untitled'}&quot; to {recipientCount > 0 ? `${recipientCount.toLocaleString()} recipient${recipientCount !== 1 ? 's' : ''}` : 'the selected audience'}. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSendConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
