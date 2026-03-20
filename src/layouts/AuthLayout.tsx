import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthLayout() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />

  if (user && profile) {
    return (
      <Navigate
        to={profile.role === 'profesional' ? '/profesional/dashboard' : '/client/dashboard'}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel — branding (desktop only) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-surface-container-low">
        <span className="text-primary font-display font-semibold text-2xl tracking-tight">
          EvalPro
        </span>
        <div>
          <h1 className="font-display text-5xl font-bold text-on-surface leading-tight mb-4">
            Evaluación clínica<br />de alto rendimiento
          </h1>
          <p className="text-on-surface-variant text-lg">
            Kinesiología · Nutrición · Psicología · Entrenamiento
          </p>
        </div>
        <span className="text-on-surface-variant text-sm">© 2026 EvalPro</span>
      </div>

      {/* Right panel — page content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-16">

        {/* Mobile logo */}
        <div className="md:hidden mb-10 text-center">
          <span className="text-primary font-display font-semibold text-3xl tracking-tight">
            EvalPro
          </span>
          <p className="text-on-surface-variant text-sm mt-2">Evaluación clínica profesional</p>
        </div>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
