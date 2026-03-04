export type TemplateType =
  | 'welcome'
  | 'verification'
  | 'password-reset'
  | 'subscription-confirm'
  | 'subscription-canceled'
  | 'team-invitation'
  | 'kpi-report';

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

const COMMON_VARIABLES: TemplateVariable[] = [
  { name: 'userName', description: 'Recipient name', required: true, defaultValue: 'User' },
  { name: 'appName', description: 'Application name', required: false, defaultValue: 'MuseKit' },
  { name: 'supportEmail', description: 'Support email address', required: false, defaultValue: 'support@musekit.app' },
  { name: 'websiteUrl', description: 'Main website URL', required: false, defaultValue: 'https://musekit.app' },
  { name: 'currentYear', description: 'Current year', required: false },
];

const TEMPLATE_SPECIFIC_VARIABLES: Record<TemplateType, TemplateVariable[]> = {
  'welcome': [
    { name: 'actionUrl', description: 'URL to get started', required: true },
  ],
  'verification': [
    { name: 'verificationUrl', description: 'Email verification link', required: true },
    { name: 'expiresIn', description: 'Link expiration time', required: false, defaultValue: '24 hours' },
  ],
  'password-reset': [
    { name: 'resetUrl', description: 'Password reset link', required: true },
    { name: 'expiresIn', description: 'Link expiration time', required: false, defaultValue: '1 hour' },
  ],
  'subscription-confirm': [
    { name: 'planName', description: 'Subscription plan name', required: true },
    { name: 'billingCycle', description: 'Monthly or yearly', required: false, defaultValue: 'monthly' },
    { name: 'amount', description: 'Subscription amount', required: true },
    { name: 'dashboardUrl', description: 'Link to dashboard', required: true },
  ],
  'subscription-canceled': [
    { name: 'planName', description: 'Canceled plan name', required: true },
    { name: 'endDate', description: 'When access ends', required: true },
    { name: 'resubscribeUrl', description: 'Link to resubscribe', required: false },
  ],
  'team-invitation': [
    { name: 'inviterName', description: 'Person who sent the invite', required: true },
    { name: 'organizationName', description: 'Organization name', required: true },
    { name: 'role', description: 'Assigned role', required: false, defaultValue: 'member' },
    { name: 'inviteUrl', description: 'Invitation accept link', required: true },
    { name: 'expiresIn', description: 'Invite expiration time', required: false, defaultValue: '7 days' },
  ],
  'kpi-report': [
    { name: 'period', description: 'Report period (e.g., "Jan 2025")', required: true },
    { name: 'periodType', description: 'Weekly or monthly', required: true },
    { name: 'totalUsers', description: 'Total user count', required: true },
    { name: 'newUsers', description: 'New users this period', required: true },
    { name: 'activeUsers', description: 'Active users this period', required: true },
    { name: 'revenue', description: 'Revenue this period', required: true },
    { name: 'mrr', description: 'Monthly recurring revenue', required: true },
    { name: 'churnRate', description: 'Churn rate percentage', required: true },
    { name: 'dashboardUrl', description: 'Link to full dashboard', required: true },
  ],
};

export function getAvailableVariables(templateType: TemplateType): TemplateVariable[] {
  const specific = TEMPLATE_SPECIFIC_VARIABLES[templateType] || [];
  return [...COMMON_VARIABLES, ...specific];
}

export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables) {
      return variables[key];
    }
    return match;
  });
}

export interface ValidationResult {
  valid: boolean;
  missingVariables: string[];
  unusedVariables: string[];
}

export function validateTemplate(
  template: string,
  templateType?: TemplateType,
  providedVariables?: Record<string, string>
): ValidationResult {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const foundPlaceholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    foundPlaceholders.add(match[1]);
  }

  const missingVariables: string[] = [];
  const unusedVariables: string[] = [];

  if (templateType) {
    const available = getAvailableVariables(templateType);
    const required = available.filter((v) => v.required);

    for (const v of required) {
      if (!foundPlaceholders.has(v.name) && !(providedVariables && v.name in providedVariables)) {
        missingVariables.push(v.name);
      }
    }
  }

  if (providedVariables) {
    for (const key of Object.keys(providedVariables)) {
      if (!foundPlaceholders.has(key)) {
        unusedVariables.push(key);
      }
    }
  }

  return {
    valid: missingVariables.length === 0,
    missingVariables,
    unusedVariables,
  };
}
