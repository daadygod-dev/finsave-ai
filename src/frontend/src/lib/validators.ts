/** Shared client-side validators for auth and other forms. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required.'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirm your password.'
  if (confirm !== password) return 'Passwords do not match.'
  return null
}

/** Map common Supabase Auth errors to clear, user-facing messages. */
export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lowered = message.toLowerCase()

  if (lowered.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (lowered.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the verification link.'
  }
  if (lowered.includes('already registered') || lowered.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead.'
  }
  if (lowered.includes('password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (lowered.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (lowered.includes('token has expired') || lowered.includes('invalid')) {
    return 'This link is invalid or has expired. Request a new one.'
  }

  return message
}
