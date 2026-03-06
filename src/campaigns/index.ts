/**
 * @musekit/email — Campaign Management
 *
 * REQUIRED DATABASE SCHEMA: campaigns table
 * The campaigns table may currently only have (id, created_at).
 * The following columns are required for full functionality.
 * If missing, coordinate with musekit-database (prompt 08) to add them.
 *
 * | Column             | Type          | Description                                           |
 * |--------------------|---------------|-------------------------------------------------------|
 * | id                 | uuid (PK)     | Auto-generated                                        |
 * | name               | text          | Campaign name                                         |
 * | subject            | text          | Email subject line                                    |
 * | body               | text          | HTML email body                                       |
 * | from_name          | text          | Sender display name                                   |
 * | reply_to           | text          | Reply-to email address                                |
 * | status             | text          | CHECK ('draft','scheduled','sending','sent','failed') |
 * | audience           | jsonb         | Audience filter criteria                              |
 * | scheduled_at       | timestamptz   | Scheduled send time (null = manual)                   |
 * | sent_at            | timestamptz   | Actual send time                                      |
 * | sent_count         | integer       | Number of emails sent                                 |
 * | open_rate          | numeric       | Open rate percentage                                  |
 * | click_rate         | numeric       | Click rate percentage                                 |
 * | bounce_count       | integer       | Number of bounced emails                              |
 * | unsubscribe_count  | integer       | Number of unsubscribes                                |
 * | created_at         | timestamptz   | Auto-generated                                        |
 * | updated_at         | timestamptz   | Auto-generated                                        |
 *
 * REQUIRED DATABASE SCHEMA: audit_logs table
 * | Column       | Type          | Description                  |
 * |--------------|---------------|------------------------------|
 * | id           | uuid (PK)     | Auto-generated               |
 * | action       | text          | e.g. 'campaign.sent'         |
 * | entity_type  | text          | e.g. 'campaign'              |
 * | entity_id    | text          | ID of the related entity     |
 * | metadata     | jsonb         | Additional context           |
 * | user_id      | uuid          | User who performed action    |
 * | created_at   | timestamptz   | Auto-generated               |
 */

export { CampaignList } from './CampaignList';
export { CampaignEditor } from './CampaignEditor';
export { CampaignDetail } from './CampaignDetail';

export type {
  Campaign,
  CampaignStatus,
  AudienceFilter,
  AudienceType,
  CampaignFormData,
} from './types';
export { STATUS_COLORS, SUBSCRIPTION_TIERS, USER_STATUSES } from './types';

export {
  formatRelativeTime,
  formatFullDate,
  describeAudience,
  campaignsToCsv,
  downloadCsv,
  writeAuditLog,
} from './utils';
export type { AuditLogEntry } from './utils';
