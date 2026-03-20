import { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  role: 'profesional' | 'client'
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>
  signInWithGoogle: () => Promise<AuthError | null>
  signInWithApple: () => Promise<AuthError | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cold start timeout: if INITIAL_SESSION never fires (offline, misconfigured client),
    // unblock the UI after 10s showing the login screen instead of a permanent blank.
    const timeout = setTimeout(() => {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }, 10000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(timeout)

      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (error || !data || !['profesional', 'client'].includes(data.role)) {
          // Profile fetch failed or unknown role — unblock UI immediately, then sign out.
          // Do NOT rely on the subsequent onAuthStateChange null-session to clear state:
          // that re-entry is asynchronous and the UI must unblock now.
          console.error('[AuthContext] Profile fetch failed:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          await supabase.auth.signOut()
          return
        }

        setUser(session.user)
        setProfile({ role: data.role as 'profesional' | 'client' })
        setLoading(false)
      } else {
        // Covers: logout, session expiry, signOut call, cold start with no session.
        // Explicit null assignment prevents stale role state after logout.
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signInWithGoogle(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    })
    return error
  }

  async function signInWithApple(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/login` },
    })
    return error
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    // onAuthStateChange null-session handler sets user/profile to null
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
