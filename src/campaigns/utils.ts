import type { Campaign, AudienceFilter } from './types';

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return date.toLocaleDateString();
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function describeAudience(audience: AudienceFilter): string {
  switch (audience.type) {
    case 'all':
      return 'All users';
    case 'tier':
      return `Tiers: ${audience.tiers?.join(', ') || 'None'}`;
    case 'status':
      return `Status: ${audience.statuses?.join(', ') || 'None'}`;
    case 'date_range':
      if (audience.dateRange) {
        return `Signed up ${audience.dateRange.start} to ${audience.dateRange.end}`;
      }
      return 'Date range (not set)';
    case 'custom':
      const count = audience.customEmails?.length || 0;
      return `Custom list (${count} email${count !== 1 ? 's' : ''})`;
    default:
      return 'Unknown';
  }
}

export function campaignsToCsv(campaigns: Campaign[]): string {
  const headers = ['Name', 'Subject', 'Status', 'Sent Count', 'Open Rate', 'Click Rate', 'Bounce Count', 'Unsubscribes', 'Created', 'Sent Date'];
  const rows = campaigns.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.subject.replace(/"/g, '""')}"`,
    c.status,
    c.sent_count.toString(),
    `${c.open_rate}%`,
    `${c.click_rate}%`,
    c.bounce_count.toString(),
    c.unsubscribe_count.toString(),
    c.created_at,
    c.sent_at || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  user_id?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();
    await supabase.from('audit_logs').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      metadata: entry.metadata,
      user_id: entry.user_id || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
