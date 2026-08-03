export type SessionScopedInput = {
  user_id?: string
  userId?: string
  [key: string]: unknown
}

export function scopeToSessionUser<T extends SessionScopedInput>(
  input: T,
  sessionUserId: string,
) {
  return {
    ...input,
    user_id: sessionUserId,
    userId: sessionUserId,
  }
}
