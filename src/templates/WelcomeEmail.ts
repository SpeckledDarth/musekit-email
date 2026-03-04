import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface WelcomeEmailProps {
  userName: string;
  actionUrl: string;
  brand?: Partial<BrandSettings>;
}

export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };

  const content = `
    <h2>Welcome to ${brand.appName}, ${props.userName}!</h2>
    <p>We're excited to have you on board. Your account has been created successfully.</p>
    <p>Get started by exploring your dashboard and setting up your workspace.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.actionUrl}" class="btn">Get Started</a>
    </div>
    <p class="text-muted">If you didn't create this account, you can safely ignore this email.</p>
  `;

  return emailWrapper(content, brand);
}

export function welcomeEmailPlainText(props: WelcomeEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  return `Welcome to ${brand.appName}, ${props.userName}!

We're excited to have you on board. Your account has been created successfully.

Get started by visiting: ${props.actionUrl}

If you didn't create this account, you can safely ignore this email.

© ${new Date().getFullYear()} ${brand.appName}`;
}
