export { sendEmail, sendBatchEmails, getResendClient } from './client';
export type { SendEmailOptions, SendEmailResult, BatchEmail, BatchEmailResult } from './client';

export {
  renderWelcomeEmail,
  welcomeEmailPlainText,
  renderVerificationEmail,
  verificationEmailPlainText,
  renderPasswordResetEmail,
  passwordResetEmailPlainText,
  renderSubscriptionConfirmEmail,
  subscriptionConfirmEmailPlainText,
  renderSubscriptionCanceledEmail,
  subscriptionCanceledEmailPlainText,
  renderTeamInvitationEmail,
  teamInvitationEmailPlainText,
  renderKPIReportEmail,
  kpiReportEmailPlainText,
  emailWrapper,
  defaultBrand,
} from './templates';

export type {
  WelcomeEmailProps,
  VerificationEmailProps,
  PasswordResetEmailProps,
  SubscriptionConfirmEmailProps,
  SubscriptionCanceledEmailProps,
  TeamInvitationEmailProps,
  KPIReportEmailProps,
} from './templates';

export { replaceVariables, getAvailableVariables, validateTemplate } from './variables';
export type { TemplateType, TemplateVariable, ValidationResult } from './variables';

export { generateKPIReport, scheduleReport, sendScheduledReport } from './reports';
export type { KPIData, ReportConfig } from './reports';

export { EmailTemplateEditor } from './editor';

export { getSupabaseClient, getBrandSettings } from './lib/supabase';
export type { BrandSettings } from './lib/supabase';
