import { useAuth } from '../contexts/AuthContext'

export function ClientDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Panel de cliente</h2>
        <p className="text-on-surface-variant text-sm">{user?.email}</p>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
