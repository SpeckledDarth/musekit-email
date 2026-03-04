import React, { useState, useMemo } from 'react';
import { EmailTemplateEditor } from '@/editor';
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderSubscriptionConfirmEmail,
  renderSubscriptionCanceledEmail,
  renderTeamInvitationEmail,
  renderKPIReportEmail,
} from '@/templates';
import type { TemplateType } from '@/variables';

const SAMPLE_TEMPLATES: Record<string, string> = {
  welcome: `<h2>Welcome to {{appName}}, {{userName}}!</h2>
<p>We're excited to have you on board.</p>
<div style="text-align: center; margin: 24px 0;">
  <a href="{{actionUrl}}" class="btn">Get Started</a>
</div>`,
  verification: `<h2>Verify Your Email</h2>
<p>Hi {{userName}}, please verify your email by clicking below.</p>
<div style="text-align: center; margin: 24px 0;">
  <a href="{{verificationUrl}}" class="btn">Verify Email</a>
</div>
<p class="text-muted">Expires in {{expiresIn}}.</p>`,
};

type View = 'editor' | 'gallery';

const TEMPLATE_NAMES: { key: string; label: string }[] = [
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
      return renderWelcomeEmail({
        userName: 'Alex',
        actionUrl: 'https://musekit.app/dashboard',
      });
    case 'verification':
      return renderVerificationEmail({
        userName: 'Alex',
        verificationUrl: 'https://musekit.app/verify?token=abc123',
      });
    case 'password-reset':
      return renderPasswordResetEmail({
        userName: 'Alex',
        resetUrl: 'https://musekit.app/reset?token=xyz789',
      });
    case 'subscription-confirm':
      return renderSubscriptionConfirmEmail({
        userName: 'Alex',
        planName: 'Pro',
        amount: '$29/mo',
        dashboardUrl: 'https://musekit.app/dashboard',
      });
    case 'subscription-canceled':
      return renderSubscriptionCanceledEmail({
        userName: 'Alex',
        planName: 'Pro',
        endDate: 'February 28, 2026',
        resubscribeUrl: 'https://musekit.app/pricing',
      });
    case 'team-invitation':
      return renderTeamInvitationEmail({
        userName: 'Alex',
        inviterName: 'Jordan',
        organizationName: 'Acme Studios',
        role: 'editor',
        inviteUrl: 'https://musekit.app/invite?code=team123',
      });
    case 'kpi-report':
      return renderKPIReportEmail({
        userName: 'Alex',
        period: 'January 2026',
        periodType: 'monthly',
        totalUsers: '12,450',
        newUsers: '1,230',
        activeUsers: '8,920',
        revenue: '$45,600',
        mrr: '$38,200',
        churnRate: '2.3%',
        dashboardUrl: 'https://musekit.app/admin/analytics',
      });
    default:
      return '';
  }
}

export default function App() {
  const [view, setView] = useState<View>('gallery');
  const [selectedGalleryTemplate, setSelectedGalleryTemplate] = useState('welcome');

  const galleryHtml = useMemo(
    () => renderPrebuiltTemplate(selectedGalleryTemplate),
    [selectedGalleryTemplate]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">@musekit/email</h1>
              <p className="text-xs text-gray-500">Email Template System</p>
            </div>
          </div>

          <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView('gallery')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'gallery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Template Gallery
            </button>
            <button
              onClick={() => setView('editor')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'editor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Template Editor
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === 'gallery' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Pre-built Templates</h2>
              <p className="text-sm text-gray-500">
                Preview all email templates with sample data. These templates support both light and dark email clients.
              </p>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {TEMPLATE_NAMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedGalleryTemplate(t.key)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    selectedGalleryTemplate === t.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-2 text-xs text-gray-500">
                  {TEMPLATE_NAMES.find((t) => t.key === selectedGalleryTemplate)?.label} — Preview
                </span>
              </div>
              <iframe
                srcDoc={galleryHtml}
                title="Template Preview"
                className="w-full border-0"
                style={{ height: '700px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Editor</h2>
              <p className="text-sm text-gray-500">
                Create and edit custom email templates with live preview and variable insertion.
              </p>
            </div>

            <div style={{ height: '600px' }}>
              <EmailTemplateEditor
                initialTemplate={SAMPLE_TEMPLATES.welcome}
                templateType="welcome"
                onSave={(t) => {
                  console.log('Template saved:', t);
                  alert('Template saved to console (connect Supabase for persistence)');
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
