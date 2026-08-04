/**
 * Display-name helpers shared by the dashboard, settings, and shell. The
 * name comes from Supabase user_metadata (name / full_name) set through
 * the profile form; the email local part is the fallback — never fake data.
 */

export function displayName(user: { fullName?: string; email: string } | null): string {
  if (user?.fullName) return user.fullName
  if (user?.email) return user.email.split('@')[0] || '—'
  return '—'
}

export function firstName(user: { fullName?: string; email: string } | null): string {
  if (user?.fullName) return user.fullName.split(' ')[0]
  if (user?.email) return user.email.split('@')[0] || 'there'
  return 'there'
}
