import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
  brand?: Partial<BrandSettings>;
}

export function renderPasswordResetEmail(props: PasswordResetEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const expiresIn = props.expiresIn || '1 hour';

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${props.userName},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.resetUrl}" class="btn">Reset Password</a>
    </div>
    <p class="text-muted">This link expires in ${expiresIn}. If you didn't request a password reset, no action is needed — your password will remain unchanged.</p>
    <p class="text-muted">Or copy and paste this URL: ${props.resetUrl}</p>
  `;

  return emailWrapper(content, brand);
}

export function passwordResetEmailPlainText(props: PasswordResetEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const expiresIn = props.expiresIn || '1 hour';
  return `Reset Your Password

Hi ${props.userName},

We received a request to reset your password. Visit the link below to choose a new password:

${props.resetUrl}

This link expires in ${expiresIn}. If you didn't request this, no action is needed.

© ${new Date().getFullYear()} ${brand.appName}`;
}
