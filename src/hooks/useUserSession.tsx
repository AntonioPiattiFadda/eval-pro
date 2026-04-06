import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/service'

export function useUserSession() {
  const [lookingForSession, setLookingForSession] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUserSession(data.session)
      setLookingForSession(false)
    }
    fetchSession()
  }, [])

  return { lookingForSession, userSession }
}
