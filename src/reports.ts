import { sendEmail } from './client';
import { renderKPIReportEmail, kpiReportEmailPlainText } from './templates/KPIReportEmail';
import type { KPIReportEmailProps } from './templates/KPIReportEmail';
import { getBrandSettings } from './lib/supabase';

export interface KPIData {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  revenue: number;
  mrr: number;
  churnRate: number;
}

export interface ReportConfig {
  recipientEmail: string;
  recipientName: string;
  period: 'weekly' | 'monthly';
  dashboardUrl: string;
}

export async function generateKPIReport(
  period: 'weekly' | 'monthly'
): Promise<KPIData> {
  try {
    const { getSupabaseClient } = await import('./lib/supabase');
    const supabase = getSupabaseClient();

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const now = new Date();
    const periodStart = new Date(now);
    if (period === 'weekly') {
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString());

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', periodStart.toISOString());

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('amount, status')
      .eq('status', 'active');

    const revenue = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
    const mrr = revenue;

    const { count: canceledCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceled_at', periodStart.toISOString());

    const totalSubs = (subscriptions?.length || 0) + (canceledCount || 0);
    const churnRate = totalSubs > 0 ? ((canceledCount || 0) / totalSubs) * 100 : 0;

    return {
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      activeUsers: activeUsers || 0,
      revenue,
      mrr,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error generating KPI report:', error);
    return {
      totalUsers: 0,
      newUsers: 0,
      activeUsers: 0,
      revenue: 0,
      mrr: 0,
      churnRate: 0,
    };
  }
}

export function scheduleReport(config: ReportConfig): { config: ReportConfig; nextRun: Date } {
  const nextRun = new Date();
  if (config.period === 'weekly') {
    const dayOfWeek = nextRun.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextRun.setDate(nextRun.getDate() + daysUntilMonday);
  } else {
    nextRun.setMonth(nextRun.getMonth() + 1);
    nextRun.setDate(1);
  }
  nextRun.setHours(9, 0, 0, 0);

  return { config, nextRun };
}

export async function sendScheduledReport(
  kpiData: KPIData,
  config: ReportConfig
): Promise<{ success: boolean; error?: string }> {
  const brand = await getBrandSettings();

  const now = new Date();
  const periodLabel = config.period === 'weekly'
    ? `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const props: KPIReportEmailProps = {
    userName: config.recipientName,
    period: periodLabel,
    periodType: config.period,
    totalUsers: kpiData.totalUsers.toLocaleString(),
    newUsers: kpiData.newUsers.toLocaleString(),
    activeUsers: kpiData.activeUsers.toLocaleString(),
    revenue: `$${kpiData.revenue.toLocaleString()}`,
    mrr: `$${kpiData.mrr.toLocaleString()}`,
    churnRate: `${kpiData.churnRate}%`,
    dashboardUrl: config.dashboardUrl,
    brand,
  };

  const html = renderKPIReportEmail(props);
  const subject = `${brand.appName} ${config.period === 'weekly' ? 'Weekly' : 'Monthly'} KPI Report — ${periodLabel}`;

  const result = await sendEmail(config.recipientEmail, subject, html);
  return { success: result.success, error: result.error };
}
