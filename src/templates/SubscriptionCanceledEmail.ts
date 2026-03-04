import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface SubscriptionCanceledEmailProps {
  userName: string;
  planName: string;
  endDate: string;
  resubscribeUrl?: string;
  brand?: Partial<BrandSettings>;
}

export function renderSubscriptionCanceledEmail(props: SubscriptionCanceledEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };

  const resubscribeButton = props.resubscribeUrl
    ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${props.resubscribeUrl}" class="btn">Resubscribe</a>
      </div>`
    : '';

  const content = `
    <h2>Subscription Canceled</h2>
    <p>Hi ${props.userName},</p>
    <p>Your <strong>${props.planName}</strong> subscription has been canceled. You'll continue to have access to your plan features until <strong>${props.endDate}</strong>.</p>
    <p>After that date, your account will revert to the free plan.</p>
    ${resubscribeButton}
    <p>We're sorry to see you go. If you have feedback about how we can improve, we'd love to hear from you at ${brand.supportEmail}.</p>
    <p class="text-muted">If you didn't request this cancellation, please contact support immediately.</p>
  `;

  return emailWrapper(content, brand);
}

export function subscriptionCanceledEmailPlainText(props: SubscriptionCanceledEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  return `Subscription Canceled

Hi ${props.userName},

Your ${props.planName} subscription has been canceled. You'll have access until ${props.endDate}.

${props.resubscribeUrl ? `To resubscribe, visit: ${props.resubscribeUrl}` : ''}

If you have feedback, contact us at ${brand.supportEmail}.

© ${new Date().getFullYear()} ${brand.appName}`;
}
