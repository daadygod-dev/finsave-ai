import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client. Session persistence and automatic token refresh
 * are handled by the library (persistSession + autoRefreshToken defaults).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
