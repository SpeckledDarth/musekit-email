import { emailWrapper, defaultBrand } from './shared';
import type { BrandSettings } from '../lib/supabase';

export interface SubscriptionConfirmEmailProps {
  userName: string;
  planName: string;
  billingCycle?: string;
  amount: string;
  dashboardUrl: string;
  brand?: Partial<BrandSettings>;
}

export function renderSubscriptionConfirmEmail(props: SubscriptionConfirmEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const billingCycle = props.billingCycle || 'monthly';

  const content = `
    <h2>Subscription Confirmed!</h2>
    <p>Hi ${props.userName},</p>
    <p>Your subscription to the <strong>${props.planName}</strong> plan has been confirmed. Here are the details:</p>
    <table class="kpi-table">
      <tr>
        <td>Plan</td>
        <td><strong>${props.planName}</strong></td>
      </tr>
      <tr>
        <td>Billing</td>
        <td><strong>${billingCycle}</strong></td>
      </tr>
      <tr>
        <td>Amount</td>
        <td><strong>${props.amount}</strong></td>
      </tr>
    </table>
    <p>You now have full access to all ${props.planName} features.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.dashboardUrl}" class="btn">Go to Dashboard</a>
    </div>
    <p class="text-muted">If you have any questions about your subscription, contact us at ${brand.supportEmail}.</p>
  `;

  return emailWrapper(content, brand);
}

export function subscriptionConfirmEmailPlainText(props: SubscriptionConfirmEmailProps): string {
  const brand = { ...defaultBrand, ...props.brand };
  const billingCycle = props.billingCycle || 'monthly';
  return `Subscription Confirmed!

Hi ${props.userName},

Your subscription to the ${props.planName} plan has been confirmed.

Plan: ${props.planName}
Billing: ${billingCycle}
Amount: ${props.amount}

Visit your dashboard: ${props.dashboardUrl}

Questions? Contact ${brand.supportEmail}

© ${new Date().getFullYear()} ${brand.appName}`;
}
