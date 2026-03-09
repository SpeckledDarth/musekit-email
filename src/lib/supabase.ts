import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export interface BrandSettings {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

export async function getBrandSettings(): Promise<BrandSettings> {
  const defaults: BrandSettings = {
    appName: 'MuseKit',
    primaryColor: '#3b6cff',
    supportEmail: 'support@musekit.app',
    websiteUrl: 'https://musekit.app',
  };

  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['app_name', 'primary_color', 'logo_url', 'support_email', 'website_url', 'palette.primaryColor']);

    if (data && data.length > 0) {
      const settingsMap: Record<string, string> = {};
      for (const row of data) {
        settingsMap[row.key] = row.value;
      }

      return {
        appName: settingsMap['app_name'] || defaults.appName,
        primaryColor: settingsMap['palette.primaryColor'] || settingsMap['primary_color'] || defaults.primaryColor,
        logoUrl: settingsMap['logo_url'] || defaults.logoUrl,
        supportEmail: settingsMap['support_email'] || defaults.supportEmail,
        websiteUrl: settingsMap['website_url'] || defaults.websiteUrl,
      };
    }
  } catch {
    // Fall through to defaults
  }

  return defaults;
}
