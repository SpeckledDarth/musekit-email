import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
  expiresIn?: string;
  brand?: Partial<BrandSettings>;
}

export function renderVerificationEmail(props: VerificationEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const expiresIn = props.expiresIn || '24 hours';

  const content = `
    <h2>Verify Your Email</h2>
    <p>Hi ${props.userName},</p>
    <p>Please verify your email address by clicking the button below.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.verificationUrl}" class="btn">Verify Email</a>
    </div>
    <p class="text-muted">This link expires in ${expiresIn}. If you didn't request this, please ignore this email.</p>
    <p class="text-muted">Or copy and paste this URL: ${props.verificationUrl}</p>
  `;

  return emailWrapper(content, brand);
}

export function verificationEmailPlainText(props: VerificationEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const expiresIn = props.expiresIn || '24 hours';
  return `Verify Your Email

Hi ${props.userName},

Please verify your email address by visiting: ${props.verificationUrl}

This link expires in ${expiresIn}.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} ${brand.appName}`;
}
