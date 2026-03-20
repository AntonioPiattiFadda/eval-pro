import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ClientLayout() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'client') return <Navigate to="/profesional/dashboard" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low">
        <span className="text-primary font-display font-semibold text-lg tracking-tight">EvalPro</span>
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant text-sm">{user.email}</span>
          <button
            onClick={signOut}
            className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
