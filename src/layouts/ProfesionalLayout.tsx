import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { RoleSwitcher } from '@/components/ui/RoleSwitcher'

export function ProfesionalLayout() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.roles?.some(r => ['PROFESSIONAL', 'ADMIN', 'SUPERADMIN'].includes(r))) return <Navigate to="/patient/dashboard" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="h-14 border-b border-outline-variant flex items-center justify-between px-4 bg-surface-container-low shrink-0">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <RoleSwitcher />
            <span className="text-on-surface-variant text-sm">{user.email}</span>
            <button
              onClick={signOut}
              className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
