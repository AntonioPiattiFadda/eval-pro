import { Navigate, Outlet } from 'react-router-dom'
import { useUserSession } from '@/hooks/useUserSession'

export function PublicRoutesAuthCheck() {
  const { lookingForSession, userSession } = useUserSession()

  if (lookingForSession) return null

  return !userSession ? <Outlet /> : <Navigate to="/" replace />
}
