import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthLayout } from './layouts/AuthLayout'
import { ClientLayout } from './layouts/ClientLayout'
import { ProfesionalLayout } from './layouts/ProfesionalLayout'
import { ClientDashboard } from './pages/ClientDashboard'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { ProfesionalDashboard } from './pages/ProfesionalDashboard'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AgendaPage } from './pages/AgendaPage'
import { PacientesPage } from './pages/PacientesPage'
import { SettingsPage } from './pages/SettingsPage'
import { PublicRoutesAuthCheck } from './pages/auth/components/PublicRoutesAuthCheck'
import { RequireAuth } from './pages/auth/components/RequireAuth'
import { RoleAuth } from './pages/auth/components/RoleAuth'

function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'PROFESSIONAL' || profile?.role === 'ADMIN') return <Navigate to="/professional/dashboard" replace />
  if (profile?.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes — redirect to dashboard if already logged in */}
          <Route element={<PublicRoutesAuthCheck />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
          </Route>

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            {/* Professional & Admin */}
            <Route element={<RoleAuth allowedRoles={['PROFESSIONAL', 'ADMIN']} redirectTo="/patient/dashboard" />}>
              <Route element={<ProfesionalLayout />}>
                <Route path="/professional/dashboard" element={<ProfesionalDashboard />} />
                <Route path="/professional/agenda" element={<AgendaPage />} />
                <Route path="/professional/pacientes" element={<PacientesPage />} />
              </Route>
            </Route>

            {/* Patient */}
            <Route element={<RoleAuth allowedRoles={['PATIENT']} redirectTo="/professional/dashboard" />}>
              <Route element={<ClientLayout />}>
                <Route path="/patient/dashboard" element={<ClientDashboard />} />
              </Route>
            </Route>

            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
