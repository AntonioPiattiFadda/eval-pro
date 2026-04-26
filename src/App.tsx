import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useUserSession } from './hooks/useUserSession'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ROLE_DASHBOARD } from './hooks/useActiveRole'
import { AuthLayout } from './layouts/AuthLayout'
import { PatientLayout } from './layouts/PatientLayout'
import { ProfesionalLayout } from './layouts/ProfesionalLayout'
import { PatientDashboard } from './pages/patient/PatientDashboard'
import { AppointmentsPage } from './pages/patient/appointments/AppointmentsPage'
import { PlansPage } from './pages/patient/plans/PlansPage'
import { PatientPlanDetailPage } from './pages/patient/plans/PatientPlanDetailPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ProfessionalDashboard } from './pages/professional/ProfessionalDashboard'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { AgendaPage } from './pages/agenda/AgendaPage'
import { PatientsPage } from './pages/patients/PatientsPage'
import { TrainingPlansListPage } from './pages/training-plans/TrainingPlansListPage'
import { TrainingPlanBuilderPage } from './pages/training-plans/TrainingPlanBuilderPage'
import { PatientDetailPage } from './pages/patient-detail/PatientDetailPage'
import { SessionPage } from './pages/sessions/SessionPage'
import { AnamnesisPhase1Page } from './pages/sessions/AnamnesisPhase1Page'
import { SettingsPage } from './pages/settings/SettingsPage'
import { OrganizationsPage } from './pages/organizations/OrganizationsPage'
import { ExerciseBankPage } from './pages/superadmin/ExerciseBankPage'
import { PublicRoutesAuthCheck } from './pages/auth/components/PublicRoutesAuthCheck'
import { RequireAuth } from './pages/auth/components/RequireAuth'
import { RoleAuth } from './pages/auth/components/RoleAuth'

const queryClient = new QueryClient()

function RootRedirect() {

  const { lookingForSession, userSession } = useUserSession()
  const { loading, activeRole } = useAuth()

  if (lookingForSession || loading) return <LoadingScreen />

  if (!userSession) return <Navigate to="/login" replace />

  if (activeRole) return <Navigate to={ROLE_DASHBOARD[activeRole]} replace />
  return <LoadingScreen />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Public routes — redirect to dashboard if already logged in */}
            <Route element={<PublicRoutesAuthCheck />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>

            {/* Reset password — always accessible, recovery token may create a session */}
            <Route element={<AuthLayout />}>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              {/* Admin only */}
              <Route element={<RoleAuth allowedRoles={['ADMIN', 'SUPERADMIN']} redirectTo="/professional/dashboard" />}>
                <Route element={<ProfesionalLayout />}>
                  <Route path="/admin/organizations" element={<OrganizationsPage />} />
                </Route>
              </Route>

              {/* Superadmin only */}
              <Route element={<RoleAuth allowedRoles={['SUPERADMIN']} redirectTo="/professional/dashboard" />}>
                <Route element={<ProfesionalLayout />}>
                  <Route path="/superadmin/exercise-bank" element={<ExerciseBankPage />} />
                </Route>
              </Route>

              {/* Professional & Admin */}
              <Route element={<RoleAuth allowedRoles={['PROFESSIONAL', 'ADMIN', 'SUPERADMIN']} redirectTo="/patient/dashboard" />}>
                <Route element={<ProfesionalLayout />}>
                  <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
                  <Route path="/professional/agenda" element={<AgendaPage />} />
                  <Route path="/professional/patients" element={<PatientsPage />} />
                  <Route path="/professional/patients/:patientId" element={<PatientDetailPage />} />
                  <Route path="/professional/sessions/:sessionId" element={<SessionPage />} />
                  <Route path="/professional/sessions/:sessionId/anamnesis-fase1" element={<AnamnesisPhase1Page />} />
                  <Route path="/professional/training-plans" element={<TrainingPlansListPage />} />
                  <Route path="/professional/training-plans/:planId" element={<TrainingPlanBuilderPage />} />
                </Route>
              </Route>

              {/* Patient */}
              <Route element={<RoleAuth allowedRoles={['PATIENT']} redirectTo="/professional/dashboard" />}>
                <Route element={<PatientLayout />}>
                  <Route path="/patient/dashboard" element={<PatientDashboard />} />
                  <Route path="/patient/appointments" element={<AppointmentsPage />} />
                  <Route path="/patient/plans" element={<PlansPage />} />
                  <Route path="/patient/plans/:planId" element={<PatientPlanDetailPage />} />
                </Route>
              </Route>

              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
