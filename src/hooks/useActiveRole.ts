import { useState, useEffect } from 'react'
import type { UserRole } from '@/types/users.types'

const ROLE_PRIORITY: Record<UserRole, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  PROFESSIONAL: 2,
  PATIENT: 1,
}

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  SUPERADMIN: '/professional/dashboard',
  ADMIN: '/professional/dashboard',
  PROFESSIONAL: '/professional/dashboard',
  PATIENT: '/patient/dashboard',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  PROFESSIONAL: 'Profesional',
  PATIENT: 'Paciente',
}

const STORAGE_KEY = 'evalpro_active_role'

export function highestRole(roles: UserRole[]): UserRole | null {
  if (!roles.length) return null
  return roles.reduce((best, r) => ROLE_PRIORITY[r] > ROLE_PRIORITY[best] ? r : best)
}

export function useActiveRole(roles: UserRole[]) {
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null)

  useEffect(() => {
    if (!roles.length) return
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole | null
    if (stored && roles.includes(stored)) {
      setActiveRoleState(stored)
    } else {
      setActiveRoleState(highestRole(roles))
    }
  }, [roles])

  const setActiveRole = (role: UserRole) => {
    localStorage.setItem(STORAGE_KEY, role)
    setActiveRoleState(role)
  }

  return { activeRole, setActiveRole }
}
