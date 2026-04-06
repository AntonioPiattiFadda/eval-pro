import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_DASHBOARD, ROLE_LABEL } from '@/hooks/useActiveRole'
import type { UserRole } from '@/types/users.types'

export function RoleSwitcher() {
  const { profile, activeRole, setActiveRole } = useAuth()
  const navigate = useNavigate()

  const roles = profile?.roles ?? []
  if (roles.length <= 1) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as UserRole
    setActiveRole(role)
    navigate(ROLE_DASHBOARD[role])
  }

  return (
    <select
      value={activeRole ?? ''}
      onChange={handleChange}
      className="text-sm bg-surface-container text-on-surface border border-outline-variant rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {roles.map(role => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  )
}
