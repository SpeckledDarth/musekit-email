"use client";

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  from_name: string;
  reply_to: string;
  status: CampaignStatus;
  audience: AudienceFilter;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  bounce_count: number;
  unsubscribe_count: number;
  created_at: string;
  updated_at: string;
}

export type AudienceType = 'all' | 'tier' | 'status' | 'date_range' | 'custom';

export interface AudienceFilter {
  type: AudienceType;
  tiers?: string[];
  statuses?: string[];
  dateRange?: { start: string; end: string };
  customEmails?: string[];
}

export interface CampaignFormData {
  name: string;
  subject: string;
  from_name: string;
  reply_to: string;
  body: string;
  audience: AudienceFilter;
  scheduled_at: string | null;
}

export type RecipientDeliveryStatus = 'pending' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

export interface CampaignRecipient {
  id: string;
  email: string;
  name?: string;
  status: RecipientDeliveryStatus;
  delivered_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
}

export const RECIPIENT_STATUS_COLORS: Record<RecipientDeliveryStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-400' },
  delivered: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
  opened: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
  clicked: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-300' },
  bounced: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' },
  unsubscribed: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-300' },
};

export const SUBSCRIPTION_TIERS = ['Starter', 'Basic', 'Premium'] as const;
export const USER_STATUSES = ['Active', 'Trialing', 'Churned'] as const;

export const STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-300' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
  sending: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-300' },
  sent: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' },
};
