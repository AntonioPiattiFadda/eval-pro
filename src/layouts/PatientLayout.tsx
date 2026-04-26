import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PatientSidebar } from '@/components/PatientSidebar'
import { RoleSwitcher } from '@/components/ui/RoleSwitcher'
import { PatientBottomNav } from '@/components/PatientBottomNav'

export function PatientLayout() {
  const { user, loading, profile, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.roles?.includes('PATIENT')) return <Navigate to="/professional/dashboard" replace />

  return (
    <SidebarProvider>
      {/*
        Desktop (lg+): display:contents → PatientSidebar renders as direct flex child of SidebarProvider
        Mobile/tablet (< lg): display:none → sidebar completely hidden
      */}
      <div className="hidden lg:contents">
        <PatientSidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden" style={{ height: '100dvh' }}>
        <header className="shrink-0 h-14 border-b border-outline-variant flex items-center justify-between px-4 bg-surface-container-low">
          {/* Desktop: sidebar toggle */}
          <SidebarTrigger className="hidden lg:flex" />
          {/* Mobile/tablet: app name */}
          <span className="font-display font-semibold text-primary text-lg tracking-tight lg:hidden">
            EvalPro
          </span>

          <div className="flex items-center gap-4">
            <RoleSwitcher />
            <button
              onClick={signOut}
              className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile/tablet bottom nav */}
        <div className="block lg:hidden">
          <PatientBottomNav />
        </div>
      </div>
    </SidebarProvider>
  )
}
