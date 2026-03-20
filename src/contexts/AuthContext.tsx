import { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>
  signInWithGoogle: () => Promise<AuthError | null>
  signInWithApple: () => Promise<AuthError | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signInWithGoogle(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    return error
  }

  async function signInWithApple(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' })
    return error
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
