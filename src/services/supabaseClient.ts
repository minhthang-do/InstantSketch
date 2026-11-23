import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('instantsketch_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('instantsketch_supabase_key') || '' : '';

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
};

export const setCustomSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('instantsketch_supabase_url', url.trim());
    localStorage.setItem('instantsketch_supabase_key', anonKey.trim());
    window.location.reload();
  }
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};
