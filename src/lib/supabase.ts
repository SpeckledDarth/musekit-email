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
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('brand_settings')
      .select('*')
      .single();

    if (data) {
      return {
        appName: data.app_name || 'MuseKit',
        primaryColor: data.primary_color || '#3b6cff',
        logoUrl: data.logo_url,
        supportEmail: data.support_email || 'support@musekit.app',
        websiteUrl: data.website_url || 'https://musekit.app',
      };
    }
  } catch {
    // Fall through to defaults
  }

  return {
    appName: 'MuseKit',
    primaryColor: '#3b6cff',
    supportEmail: 'support@musekit.app',
    websiteUrl: 'https://musekit.app',
  };
}
