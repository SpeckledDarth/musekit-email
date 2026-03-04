import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface TeamInvitationEmailProps {
  userName: string;
  inviterName: string;
  organizationName: string;
  role?: string;
  inviteUrl: string;
  expiresIn?: string;
  brand?: Partial<BrandSettings>;
}

export function renderTeamInvitationEmail(props: TeamInvitationEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const role = props.role || 'member';
  const expiresIn = props.expiresIn || '7 days';

  const content = `
    <h2>You've Been Invited!</h2>
    <p>Hi ${props.userName},</p>
    <p><strong>${props.inviterName}</strong> has invited you to join <strong>${props.organizationName}</strong> on ${brand.appName} as a <strong>${role}</strong>.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.inviteUrl}" class="btn">Accept Invitation</a>
    </div>
    <p class="text-muted">This invitation expires in ${expiresIn}.</p>
    <p class="text-muted">If you don't know ${props.inviterName}, you can safely ignore this email.</p>
    <p class="text-muted">Or copy and paste this URL: ${props.inviteUrl}</p>
  `;

  return emailWrapper(content, brand);
}

export function teamInvitationEmailPlainText(props: TeamInvitationEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const role = props.role || 'member';
  const expiresIn = props.expiresIn || '7 days';
  return `You've Been Invited!

Hi ${props.userName},

${props.inviterName} has invited you to join ${props.organizationName} on ${brand.appName} as a ${role}.

Accept the invitation: ${props.inviteUrl}

This invitation expires in ${expiresIn}.

© ${new Date().getFullYear()} ${brand.appName}`;
}
