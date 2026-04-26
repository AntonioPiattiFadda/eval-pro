import { createContext, useContext, useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/service'
import { getUserProfile } from '@/service/profiles'
import type { User, UserRole } from '@/types/users.types'
import { signOut as authSignOut } from '@/service/auth'
import { useActiveRole } from '@/hooks/useActiveRole'

interface AuthContextValue {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  activeRole: UserRole | null
  setActiveRole: (role: UserRole) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const { activeRole, setActiveRole } = useActiveRole(profile?.roles ?? [])

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id)
        if (userProfile) {
          setUser(session.user)
          setProfile(userProfile)
        }
      }

      setLoading(false)
    }

    loadSession()
  }, [])

  const handleSignOut = async () => {
    console.log('[auth] signOut')
    await authSignOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      activeRole,
      setActiveRole,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export type { UserRole }
