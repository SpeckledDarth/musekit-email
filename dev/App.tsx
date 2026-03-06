import React, { useState, useMemo } from 'react';
import { EmailTemplateEditor } from '@/editor';
import { TemplateList } from '@/TemplateList';
import type { EmailTemplate } from '@/TemplateList';
import { CampaignList } from '@/campaigns/CampaignList';
import { CampaignEditor } from '@/campaigns/CampaignEditor';
import { CampaignDetail } from '@/campaigns/CampaignDetail';
import type { Campaign, CampaignFormData, CampaignRecipient } from '@/campaigns/types';
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderSubscriptionConfirmEmail,
  renderSubscriptionCanceledEmail,
  renderTeamInvitationEmail,
  renderKPIReportEmail,
} from '@/templates';

const SAMPLE_TEMPLATES: Record<string, string> = {
  welcome: `<h2>Welcome to {{appName}}, {{userName}}!</h2>
<p>We're excited to have you on board.</p>
<div style="text-align: center; margin: 24px 0;">
  <a href="{{actionUrl}}" class="btn">Get Started</a>
</div>`,
};

const MOCK_RECIPIENTS: CampaignRecipient[] = [
  { id: 'r1', email: 'alex@example.com', name: 'Alex Turner', status: 'clicked', delivered_at: '2025-03-01T10:05:00Z', opened_at: '2025-03-01T11:20:00Z', clicked_at: '2025-03-01T11:25:00Z' },
  { id: 'r2', email: 'sarah@example.com', name: 'Sarah Chen', status: 'opened', delivered_at: '2025-03-01T10:05:00Z', opened_at: '2025-03-01T14:30:00Z', clicked_at: null },
  { id: 'r3', email: 'james@example.com', name: 'James Wilson', status: 'delivered', delivered_at: '2025-03-01T10:06:00Z', opened_at: null, clicked_at: null },
  { id: 'r4', email: 'emma@example.com', name: 'Emma Davis', status: 'bounced', delivered_at: null, opened_at: null, clicked_at: null },
  { id: 'r5', email: 'michael@example.com', name: 'Michael Brown', status: 'opened', delivered_at: '2025-03-01T10:05:00Z', opened_at: '2025-03-02T09:10:00Z', clicked_at: null },
  { id: 'r6', email: 'lisa@example.com', name: 'Lisa Park', status: 'unsubscribed', delivered_at: '2025-03-01T10:05:00Z', opened_at: '2025-03-01T12:00:00Z', clicked_at: null },
  { id: 'r7', email: 'david@example.com', status: 'pending', delivered_at: null, opened_at: null, clicked_at: null },
  { id: 'r8', email: 'nina@example.com', name: 'Nina Rodriguez', status: 'clicked', delivered_at: '2025-03-01T10:05:00Z', opened_at: '2025-03-01T15:45:00Z', clicked_at: '2025-03-01T15:50:00Z' },
];

type View = 'gallery' | 'editor' | 'templates' | 'campaigns' | 'campaign-new' | 'campaign-detail';

const GALLERY_NAMES: { key: string; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'verification', label: 'Verification' },
  { key: 'password-reset', label: 'Password Reset' },
  { key: 'subscription-confirm', label: 'Subscription Confirmed' },
  { key: 'subscription-canceled', label: 'Subscription Canceled' },
  { key: 'team-invitation', label: 'Team Invitation' },
  { key: 'kpi-report', label: 'KPI Report' },
];

function renderPrebuiltTemplate(key: string): string {
  switch (key) {
    case 'welcome':
      return renderWelcomeEmail({ userName: 'Alex', actionUrl: 'https://musekit.app/dashboard' });
    case 'verification':
      return renderVerificationEmail({ userName: 'Alex', verificationUrl: 'https://musekit.app/verify?token=abc123' });
    case 'password-reset':
      return renderPasswordResetEmail({ userName: 'Alex', resetUrl: 'https://musekit.app/reset?token=xyz789' });
    case 'subscription-confirm':
      return renderSubscriptionConfirmEmail({ userName: 'Alex', planName: 'Pro', amount: '$29/mo', dashboardUrl: 'https://musekit.app/dashboard' });
    case 'subscription-canceled':
      return renderSubscriptionCanceledEmail({ userName: 'Alex', planName: 'Pro', endDate: 'February 28, 2026', resubscribeUrl: 'https://musekit.app/pricing' });
    case 'team-invitation':
      return renderTeamInvitationEmail({ userName: 'Alex', inviterName: 'Jordan', organizationName: 'Acme Studios', role: 'editor', inviteUrl: 'https://musekit.app/invite?code=team123' });
    case 'kpi-report':
      return renderKPIReportEmail({ userName: 'Alex', period: 'January 2026', periodType: 'monthly', totalUsers: '12,450', newUsers: '1,230', activeUsers: '8,920', revenue: '$45,600', mrr: '$38,200', churnRate: '2.3%', dashboardUrl: 'https://musekit.app/admin/analytics' });
    default:
      return '';
  }
}

const MOCK_TEMPLATES: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to MuseKit!', body: '<h1>Welcome</h1>', description: 'Sent after signup', category: 'Welcome', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-20T14:30:00Z' },
  { id: '2', name: 'Email Verification', subject: 'Verify your email', body: '<h1>Verify</h1>', description: 'Email verification link', category: 'Verification', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
  { id: '3', name: 'Password Reset', subject: 'Reset your password', body: '<h1>Reset</h1>', description: 'Password reset flow', category: 'Reset Password', created_at: '2026-01-16T10:00:00Z', updated_at: '2026-02-10T11:00:00Z' },
  { id: '4', name: 'Subscription Confirmed', subject: 'You\'re subscribed!', body: '<h1>Confirmed</h1>', description: 'After checkout', category: 'Subscription', created_at: '2026-01-18T10:00:00Z', updated_at: '2026-03-01T16:00:00Z' },
  { id: '5', name: 'Subscription Canceled', subject: 'Sorry to see you go', body: '<h1>Canceled</h1>', description: 'After cancellation', category: 'Subscription', created_at: '2026-01-18T10:00:00Z', updated_at: '2026-02-25T08:00:00Z' },
  { id: '6', name: 'Team Invitation', subject: 'You\'ve been invited!', body: '<h1>Invite</h1>', description: 'Org invite', category: 'Team', created_at: '2026-01-20T10:00:00Z', updated_at: '2026-03-02T12:00:00Z' },
  { id: '7', name: 'Monthly KPI Report', subject: 'Your monthly metrics', body: '<h1>KPIs</h1>', description: 'KPI summary', category: 'Report', created_at: '2026-01-22T10:00:00Z', updated_at: '2026-03-05T07:00:00Z' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'March Newsletter', subject: 'What\'s new in March', body: '<h2>March Updates</h2><p>Here is what we shipped this month.</p>', from_name: 'MuseKit', reply_to: 'hello@musekit.app', status: 'sent', audience: { type: 'all' }, scheduled_at: null, sent_at: '2026-03-01T09:00:00Z', sent_count: 1240, open_rate: 42.5, click_rate: 12.3, bounce_count: 8, unsubscribe_count: 3, created_at: '2026-02-25T10:00:00Z', updated_at: '2026-03-01T09:05:00Z' },
  { id: 'c2', name: 'Pro Plan Launch', subject: 'Introducing Pro Plan', body: '<h2>Go Pro</h2><p>Unlock premium features.</p>', from_name: 'MuseKit', reply_to: '', status: 'scheduled', audience: { type: 'tier', tiers: ['Basic'] }, scheduled_at: '2026-03-10T14:00:00Z', sent_at: null, sent_count: 0, open_rate: 0, click_rate: 0, bounce_count: 0, unsubscribe_count: 0, created_at: '2026-03-03T08:00:00Z', updated_at: '2026-03-03T08:30:00Z' },
  { id: 'c3', name: 'Win-back Campaign', subject: 'We miss you!', body: '<h2>Come Back</h2><p>We have new features.</p>', from_name: 'MuseKit Team', reply_to: 'support@musekit.app', status: 'draft', audience: { type: 'status', statuses: ['Churned'] }, scheduled_at: null, sent_at: null, sent_count: 0, open_rate: 0, click_rate: 0, bounce_count: 0, unsubscribe_count: 0, created_at: '2026-03-04T15:00:00Z', updated_at: '2026-03-04T15:00:00Z' },
  { id: 'c4', name: 'Feature Announcement', subject: 'New: Team Workspaces', body: '<h2>Team Workspaces</h2><p>Collaborate with your team.</p>', from_name: 'MuseKit', reply_to: '', status: 'sent', audience: { type: 'all' }, scheduled_at: null, sent_at: '2026-02-15T10:00:00Z', sent_count: 980, open_rate: 38.1, click_rate: 8.7, bounce_count: 12, unsubscribe_count: 1, created_at: '2026-02-14T09:00:00Z', updated_at: '2026-02-15T10:05:00Z' },
  { id: 'c5', name: 'Holiday Promo', subject: '20% off for the holidays', body: '<h2>Holiday Sale</h2>', from_name: 'MuseKit', reply_to: '', status: 'failed', audience: { type: 'all' }, scheduled_at: null, sent_at: null, sent_count: 0, open_rate: 0, click_rate: 0, bounce_count: 0, unsubscribe_count: 0, created_at: '2025-12-20T08:00:00Z', updated_at: '2025-12-20T08:05:00Z' },
];

export default function App() {
  const [view, setView] = useState<View>('gallery');
  const [selectedGalleryTemplate, setSelectedGalleryTemplate] = useState('welcome');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const galleryHtml = useMemo(
    () => renderPrebuiltTemplate(selectedGalleryTemplate),
    [selectedGalleryTemplate]
  );

  const navItems: { key: View; label: string }[] = [
    { key: 'gallery', label: 'Gallery' },
    { key: 'editor', label: 'Editor' },
    { key: 'templates', label: 'Templates' },
    { key: 'campaigns', label: 'Campaigns' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">@musekit/email</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email Template System</p>
            </div>
          </div>

          <nav className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setSelectedCampaign(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === item.key || (item.key === 'campaigns' && (view === 'campaign-new' || view === 'campaign-detail'))
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === 'gallery' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pre-built Templates</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preview all email templates with sample data. These templates support both light and dark email clients.
              </p>
            </div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {GALLERY_NAMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedGalleryTemplate(t.key)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    selectedGalleryTemplate === t.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {GALLERY_NAMES.find((t) => t.key === selectedGalleryTemplate)?.label} — Preview
                </span>
              </div>
              <iframe srcDoc={galleryHtml} title="Template Preview" className="w-full border-0" style={{ height: '700px' }} sandbox="allow-same-origin" />
            </div>
          </div>
        )}

        {view === 'editor' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Template Editor</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create and edit custom email templates with live preview and variable insertion.
              </p>
            </div>
            <div style={{ height: '600px' }}>
              <EmailTemplateEditor
                initialTemplate={SAMPLE_TEMPLATES.welcome}
                templateType="welcome"
                onSave={(t) => console.log('Template saved:', t)}
              />
            </div>
          </div>
        )}

        {view === 'templates' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Template List</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage email templates with search, sort, filter, and duplicate functionality.
              </p>
            </div>
            <TemplateList
              templates={MOCK_TEMPLATES}
              onEdit={(t) => console.log('Edit template:', t.name)}
              onDuplicate={(t) => console.log('Duplicate template:', t.name)}
              onDelete={(t) => console.log('Delete template:', t.name)}
            />
          </div>
        )}

        {view === 'campaigns' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Campaigns</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create and manage email campaigns to reach your users.
              </p>
            </div>
            <CampaignList
              campaigns={MOCK_CAMPAIGNS}
              onNewCampaign={() => setView('campaign-new')}
              onSelectCampaign={(c) => { setSelectedCampaign(c); setView('campaign-detail'); }}
              onDeleteCampaigns={(ids) => console.log('Delete campaigns:', ids)}
            />
          </div>
        )}

        {view === 'campaign-new' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">New Campaign</h2>
            </div>
            <div style={{ height: '700px' }}>
              <CampaignEditor
                onCancel={() => setView('campaigns')}
                onSaveDraft={(data) => console.log('Save draft:', data)}
                onSchedule={(data) => console.log('Schedule:', data)}
                onSendNow={(data, count) => console.log('Send now to', count, 'recipients:', data)}
                onSendTest={(html, email) => console.log('Send test to', email)}
                estimateRecipients={(audience) => {
                  if (audience.type === 'all') return 1240;
                  if (audience.type === 'custom') return audience.customEmails?.length || 0;
                  return 350;
                }}
              />
            </div>
          </div>
        )}

        {view === 'campaign-detail' && selectedCampaign && (
          <CampaignDetail
            campaign={selectedCampaign}
            recipients={MOCK_RECIPIENTS}
            onBack={() => setView('campaigns')}
            onDuplicate={(c) => console.log('Duplicate:', c.name)}
            onDelete={(c) => { console.log('Delete:', c.name); setView('campaigns'); }}
          />
        )}
      </main>
    </div>
  );
}
