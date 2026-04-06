import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/users.types'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface RoleAuthProps {
  allowedRoles: UserRole[]
  redirectTo: string
}

export function RoleAuth({ allowedRoles, redirectTo }: RoleAuthProps) {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return profile?.roles?.some(r => allowedRoles.includes(r))
    ? <Outlet />
    : <Navigate to={redirectTo} replace />
}
