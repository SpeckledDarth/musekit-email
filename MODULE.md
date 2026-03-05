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

// Send a single email
const result = await sendEmail(
  'user@example.com',
  'Welcome!',
  '<h1>Hello</h1>',
  { from: 'MuseKit <noreply@musekit.app>' }
);

// Send batch emails
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

// Get available variables for a template type
const vars = getAvailableVariables('welcome');

// Replace variables in a template string
const html = replaceVariables(
  '<h1>Hello {{userName}}</h1>',
  { userName: 'Alex' }
);

// Validate a template
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

- `email_templates` — Custom admin templates
- `profiles` — User info for template variables
- `settings` — App settings as key-value pairs (id, key, value)
- `subscriptions` — Subscription data for KPI reports
