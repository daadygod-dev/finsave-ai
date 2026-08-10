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

/**
 * Canonical public origin of the app.
 *
 * Supabase confirmation and password-reset emails link here, so the
 * callback URL never depends on where the user happened to open the app
 * (e.g. localhost during development, or a preview URL). Override per
 * environment with VITE_SITE_URL; defaults to the production domain.
 */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') ??
  'https://finsave.aitoolshq.space'
