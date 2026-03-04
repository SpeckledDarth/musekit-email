# @musekit/email

## Overview
The `@musekit/email` package provides the complete email system for the MuseKit SaaS platform using Resend. It includes pre-built email templates, a visual template editor, a template variable system, and scheduled KPI report functionality.

## Tech Stack
- **Runtime**: Node.js 20
- **Language**: TypeScript (strict mode)
- **UI Framework**: React 18.3.1
- **Styling**: Tailwind CSS v3.4.x
- **Build Tool**: Vite
- **Email Service**: Resend
- **Database**: Supabase (for brand settings, profiles, subscriptions)

## Project Structure
```
src/
  index.ts              — Main package entry, exports everything
  client.ts             — Resend client (sendEmail, sendBatchEmails)
  variables.ts          — Template variable system (replace, validate, list)
  reports.ts            — KPI report generation and scheduling
  editor.tsx            — EmailTemplateEditor React component
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
dev/
  index.html            — Dev playground HTML
  main.tsx              — Dev entry point
  App.tsx               — Gallery + Editor playground app
  index.css             — Tailwind imports
```

## Environment Secrets
- `RESEND_API_KEY` — Resend API key for sending emails
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

## Development
- Dev server runs via Vite on port 5000
- The `dev/` directory contains a playground app for previewing templates and testing the editor
- The `src/` directory contains the actual package source code

## Key Features
1. **Resend Client** — `sendEmail()` and `sendBatchEmails()` for sending emails
2. **7 Email Templates** — Welcome, Verification, Password Reset, Subscription Confirm/Cancel, Team Invitation, KPI Report
3. **Template Editor** — React component with live preview, variable insertion, and test sending
4. **Variable System** — `replaceVariables()`, `getAvailableVariables()`, `validateTemplate()`
5. **KPI Reports** — `generateKPIReport()`, `scheduleReport()`, `sendScheduledReport()`

## Deployment
- Configured as static site deployment
- Build: `npx vite build`
- Output: `dist/`
