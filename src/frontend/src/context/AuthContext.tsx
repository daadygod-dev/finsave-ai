import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserRole } from '../api/types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { setAccessToken } from '../lib/session'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthUser = {
  id: string
  email: string
  /** Display name from Supabase user_metadata (name / full_name), if set. */
  fullName?: string
  /** Identity-level preferences persisted in Supabase user_metadata. */
  preferences: {
    notifications: boolean
    aiCoaching: boolean
  }
}

export type ProfilePatch = {
  name?: string
  notifications?: boolean
  aiCoaching?: boolean
}

type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  /** True when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured. */
  configured: boolean
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: UserRole) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  verifyEmailOtp: (tokenHash: string, type: string) => Promise<void>
  /** Persist name + non-financial preferences to Supabase user_metadata. */
  updateProfile: (patch: ProfilePatch) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readPreferences(metadata: Record<string, unknown> | undefined): AuthUser['preferences'] {
  return {
    notifications: metadata?.notifications !== false,
    aiCoaching: metadata?.aiCoaching !== false,
  }
}

function sessionToUser(session: Session): AuthUser {
  setAccessToken(session.access_token)
  const metadata = session.user.user_metadata
  const name = metadata?.name ?? metadata?.full_name

  return {
    id: session.user.id,
    email: session.user.email ?? '',
    fullName: typeof name === 'string' && name.trim() ? name.trim() : undefined,
    preferences: readPreferences(metadata),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!supabase) {
      setStatus('unauthenticated')
      return
    }

    let active = true

    // Restore a persisted session, then keep in sync with every auth event.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        setUser(sessionToUser(data.session))
        setStatus('authenticated')
      } else {
        setStatus('unauthenticated')
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (session) {
        setUser(sessionToUser(session))
        setStatus('authenticated')
      } else {
        setAccessToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Apply the session synchronously so callers can immediately use the
    // access token (e.g. to provision the User row via the backend).
    if (data.session) {
      setUser(sessionToUser(data.session))
      setStatus('authenticated')
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, role: UserRole) => {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // The role is stored in Supabase user metadata at signup; the
        // backend reads it from the verified token when provisioning the
        // Prisma User row (never from an unauthenticated body value).
        data: { role },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) throw error

    // With email confirmation disabled, signUp returns a session immediately.
    if (data.session) {
      setUser(sessionToUser(data.session))
      setStatus('authenticated')
      return { needsEmailConfirmation: false }
    }

    return { needsEmailConfirmation: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const verifyEmailOtp = useCallback(async (tokenHash: string, type: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email',
    })

    if (error) throw error

    if (data.session) {
      setUser(sessionToUser(data.session))
      setStatus('authenticated')
    }
  }, [])

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data, error } = await supabase.auth.updateUser({ data: patch })
    if (error) throw error

    if (data.user) {
      setUser((current) => {
        if (!current) return current
        const metadata = data.user!.user_metadata
        const name = metadata?.name ?? metadata?.full_name
        return {
          ...current,
          fullName: typeof name === 'string' && name.trim() ? name.trim() : current.fullName,
          preferences: readPreferences(metadata),
        }
      })
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        isAuthenticated: status === 'authenticated',
        configured,
        user,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        verifyEmailOtp,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
