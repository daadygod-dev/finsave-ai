import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Server-side Supabase admin client, created lazily from
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Used to verify user JWTs
 * (supabase.auth.getUser). Returns null when Supabase auth is not
 * configured so non-production fallbacks can kick in.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return adminClient
}
