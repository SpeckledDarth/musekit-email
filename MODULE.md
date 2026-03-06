# @musekit/email

Email system package for the MuseKit SaaS platform.

## Installation

```bash
npm install @musekit/email
```

## Quick Start

### Sending Emails

```typescript
import { sendEmail, sendBatchEmails } from '@musekit/email';

const result = await sendEmail(
  'user@example.com',
  'Welcome!',
  '<h1>Hello</h1>',
  { from: 'MuseKit <noreply@musekit.app>' }
);

const batchResult = await sendBatchEmails([
  { to: 'a@example.com', subject: 'Hello A', html: '<p>Hi A</p>' },
  { to: 'b@example.com', subject: 'Hello B', html: '<p>Hi B</p>' },
]);
```

### Using Pre-built Templates

```typescript
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderSubscriptionConfirmEmail,
  renderSubscriptionCanceledEmail,
  renderTeamInvitationEmail,
  renderKPIReportEmail,
} from '@musekit/email';

const html = renderWelcomeEmail({
  userName: 'Alex',
  actionUrl: 'https://musekit.app/dashboard',
});

await sendEmail('alex@example.com', 'Welcome to MuseKit!', html);
```

### Template Variables

```typescript
import { replaceVariables, getAvailableVariables, validateTemplate } from '@musekit/email';

const vars = getAvailableVariables('welcome');
const html = replaceVariables('<h1>Hello {{userName}}</h1>', { userName: 'Alex' });

const result = validateTemplate(template, 'welcome');
if (!result.valid) {
  console.log('Missing:', result.missingVariables);
}
```

### Template Editor Component

```tsx
import { EmailTemplateEditor } from '@musekit/email';

function AdminPage() {
  return (
    <EmailTemplateEditor
      templateType="welcome"
      initialTemplate="<h1>Hello {{userName}}</h1>"
      onSave={(template) => saveToDatabase(template)}
      onSendTest={(html, email) => sendTestEmail(html, email)}
    />
  );
}
```

### Template List Component

```tsx
import { TemplateList } from '@musekit/email';

function TemplatesPage() {
  return (
    <TemplateList
      templates={templates}
      onEdit={(template) => navigateToEdit(template)}
      onDuplicate={(template) => duplicateTemplate(template)}
      onDelete={(template) => deleteTemplate(template)}
    />
  );
}
```

### Campaign Management

```tsx
import { CampaignList, CampaignEditor, CampaignDetail } from '@musekit/email';

// Campaign List
<CampaignList
  campaigns={campaigns}
  onNewCampaign={() => navigate('/campaigns/new')}
  onSelectCampaign={(c) => navigate(`/campaigns/${c.id}`)}
  onDeleteCampaigns={(ids) => deleteCampaigns(ids)}
/>

// Campaign Editor
<CampaignEditor
  onSaveDraft={(data) => saveDraft(data)}
  onSchedule={(data) => scheduleCampaign(data)}
  onSendNow={(data, count) => sendCampaign(data)}
  onSendTest={(html, email) => sendTestEmail(html, email)}
  onCancel={() => navigate('/campaigns')}
  estimateRecipients={(audience) => getCount(audience)}
/>

// Campaign Detail
<CampaignDetail
  campaign={campaign}
  onBack={() => navigate('/campaigns')}
  onDuplicate={(c) => duplicateCampaign(c)}
  onDelete={(c) => deleteCampaign(c)}
/>
```

### KPI Reports

```typescript
import { generateKPIReport, sendScheduledReport } from '@musekit/email';

const kpiData = await generateKPIReport('monthly');
await sendScheduledReport(kpiData, {
  recipientEmail: 'admin@musekit.app',
  recipientName: 'Admin',
  period: 'monthly',
  dashboardUrl: 'https://musekit.app/admin/analytics',
});
```

### Audit Logging

```typescript
import { writeAuditLog } from '@musekit/email';

await writeAuditLog({
  action: 'campaign.sent',
  entity_type: 'campaign',
  entity_id: campaignId,
  metadata: { name, subject, recipientCount, audience },
  user_id: currentUserId,
});
```

## Templates

| Template | Props |
|----------|-------|
| WelcomeEmail | userName, actionUrl |
| VerificationEmail | userName, verificationUrl, expiresIn? |
| PasswordResetEmail | userName, resetUrl, expiresIn? |
| SubscriptionConfirmEmail | userName, planName, amount, dashboardUrl, billingCycle? |
| SubscriptionCanceledEmail | userName, planName, endDate, resubscribeUrl? |
| TeamInvitationEmail | userName, inviterName, organizationName, inviteUrl, role?, expiresIn? |
| KPIReportEmail | userName, period, periodType, totalUsers, newUsers, activeUsers, revenue, mrr, churnRate, dashboardUrl |

All templates accept an optional `brand` prop to customize appName, primaryColor, supportEmail, and websiteUrl.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Supabase Tables

- `email_templates` — Custom admin templates (id, name, subject, body, description, category, created_at, updated_at)
- `campaigns` — Email campaigns (see src/campaigns/index.ts for full required schema)
- `audit_logs` — Audit trail (action, entity_type, entity_id, metadata, user_id, created_at)
- `profiles` — User info for template variables
- `settings` — App settings as key-value pairs (id, key, value)
- `subscriptions` — Subscription data for KPI reports
