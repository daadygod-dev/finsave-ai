export type ConsentGrant = {
  lenderId: string
  businessId: string
  revokedAt: Date | null
  expiresAt: Date
}

export function hasActiveConsent(
  grant: ConsentGrant | null | undefined,
  now = new Date(),
) {
  if (!grant) return false
  if (grant.revokedAt) return false
  return grant.expiresAt.getTime() > now.getTime()
}
