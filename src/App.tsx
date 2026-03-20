import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { ProfesionalLayout } from './layouts/ProfesionalLayout'
import { ClientLayout } from './layouts/ClientLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ProfesionalDashboard } from './pages/ProfesionalDashboard'
import { ClientDashboard } from './pages/ClientDashboard'
import { useAuth } from './contexts/AuthContext'

function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'profesional') return <Navigate to="/profesional/dashboard" replace />
  if (profile?.role === 'client') return <Navigate to="/client/dashboard" replace />
  // Defensive fallback: user exists but profile is null — AuthContext is signing out
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<ProfesionalLayout />}>
          <Route path="/profesional/dashboard" element={<ProfesionalDashboard />} />
        </Route>
        <Route element={<ClientLayout />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
