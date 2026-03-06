# @musekit/email

## Overview
The `@musekit/email` package provides the complete email system for the MuseKit SaaS platform using Resend. It includes pre-built email templates, a visual template editor, a template variable system, scheduled KPI report functionality, email campaign management, and a template list component.

## Tech Stack
- **Runtime**: Node.js 20
- **Language**: TypeScript (strict mode)
- **UI Framework**: React 18.3.1
- **Styling**: Tailwind CSS v3.4.x
- **Build Tool**: Vite
- **Email Service**: Resend
- **Notifications**: Sonner (toast)
- **Database**: Supabase (for settings, profiles, subscriptions, campaigns, email_templates, audit_logs)

## Project Structure
```
src/
  index.ts              — Main package entry, exports everything
  client.ts             — Resend client (sendEmail, sendBatchEmails)
  variables.ts          — Template variable system (replace, validate, list)
  reports.ts            — KPI report generation and scheduling
  editor.tsx            — EmailTemplateEditor React component
  TemplateList.tsx      — Template list with search, sort, filter, duplicate
  lib/
    supabase.ts         — Supabase client and brand settings
  templates/
    shared.ts           — Email wrapper and default brand config
    index.ts            — Template barrel exports
    WelcomeEmail.ts
    VerificationEmail.ts
    PasswordResetEmail.ts
    SubscriptionConfirmEmail.ts
    SubscriptionCanceledEmail.ts
    TeamInvitationEmail.ts
    KPIReportEmail.ts
  campaigns/
    index.ts            — Campaign barrel exports + required schema docs
    types.ts            — Campaign, AudienceFilter, status types
    utils.ts            — Helpers (formatRelativeTime, CSV export, audit log)
    CampaignList.tsx    — Campaign list with search, sort, filter, bulk ops
    CampaignEditor.tsx  — Campaign form with audience selector + preview
    CampaignDetail.tsx  — Campaign detail with metrics + timeline
dev/
  index.html            — Dev playground HTML
  main.tsx              — Dev entry point
  App.tsx               — Full playground with Gallery, Editor, Templates, Campaigns
  index.css             — Tailwind imports
```

## Environment Secrets
- `RESEND_API_KEY` — Resend API key for sending emails
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

## Development
- Dev server runs via Vite on port 5000
- The `dev/` directory contains a playground app with 4 views: Gallery, Editor, Templates, Campaigns
- The `src/` directory contains the actual package source code
- All components use `"use client"` directive for Next.js compatibility

## Key Features
1. **Resend Client** — `sendEmail()` and `sendBatchEmails()` for sending emails
2. **7 Email Templates** — Welcome, Verification, Password Reset, Subscription Confirm/Cancel, Team Invitation, KPI Report
3. **Template Editor** — React component with live preview, variable insertion, and test sending
4. **Template List** — Searchable, sortable, filterable template list with duplicate and CSV export
5. **Variable System** — `replaceVariables()`, `getAvailableVariables()`, `validateTemplate()`
6. **KPI Reports** — `generateKPIReport()`, `scheduleReport()`, `sendScheduledReport()`
7. **Campaign Management** — CampaignList, CampaignEditor, CampaignDetail components
   - Audience targeting: all users, by tier, by status, by date range, custom email list
   - Campaign lifecycle: draft, schedule, send now, with confirmation dialogs
   - Performance metrics: sent, delivered, opened, clicked, bounced, unsubscribed
   - Recipient list with per-recipient delivery status (delivered, opened, clicked, bounced, unsubscribed)
   - Bulk operations, CSV export, audit logging on all mutations

## Supabase Tables
- `settings` — Key-value app settings (id, key, value)
- `email_templates` — Custom admin templates (id, name, subject, body, description, category, created_at, updated_at)
- `campaigns` — Email campaigns (see src/campaigns/index.ts for full required schema)
- `audit_logs` — Audit trail for mutations (action, entity_type, entity_id, metadata, user_id)
- `profiles` — User info for template variables
- `subscriptions` — Subscription data for KPI reports

## STANDARD E UX Patterns Applied
- Toast notifications on mutations (sonner)
- Empty states on all list views
- Confirmation dialogs on destructive actions
- Dark mode (`dark:` classes) on all UI
- Loading skeletons on data-fetching views
- Unsaved changes warning on forms
- Form validation with inline errors
- Relative timestamps with hover tooltips
- Row counts in list titles
- Breadcrumbs on detail views
- Pagination (25 rows/page)
- URL-persisted filters (search, status, sort, page in query params)
- Bulk operations with floating action bar
- CSV export on all list views
- Audit logging on all campaign mutations (create, update, delete, send, duplicate)

## Deployment
- Configured as static site deployment
- Build: `npx vite build`
- Output: `dist/`
