# Patient Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el área del paciente con `PatientLayout` + `PatientSidebar`, página "Mis Turnos" con datos reales, página "Mis Planes" mock, y `PatientDashboard` con cards de navegación.

**Architecture:** Se crea `PatientLayout` (análogo a `ProfesionalLayout`) con `PatientSidebar` independiente del sidebar profesional. Los datos de turnos se resuelven via `usePatientId` → `getAppointmentsForPatient`. El área cliente existente (`ClientLayout`, `ClientDashboard`) se elimina y reemplaza.

**Tech Stack:** React 19, TypeScript, React Router DOM, TanStack Query, Supabase, shadcn/ui Sidebar primitives, Lucide icons, Tailwind CSS.

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `src/components/PatientSidebar.tsx` |
| Crear | `src/layouts/PatientLayout.tsx` |
| Crear | `src/pages/patient/appointments/hooks/usePatientId.ts` |
| Crear | `src/pages/patient/appointments/services/appointments.service.ts` |
| Crear | `src/pages/patient/appointments/AppointmentsPage.tsx` |
| Crear | `src/pages/patient/plans/PlansPage.tsx` |
| Crear | `src/pages/patient/PatientDashboard.tsx` |
| Modificar | `src/App.tsx` |
| Eliminar | `src/layouts/ClientLayout.tsx` |
| Eliminar | `src/pages/client/ClientDashboard.tsx` |

---

### Task 1: PatientSidebar

**Files:**
- Create: `src/components/PatientSidebar.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import { Calendar, ClipboardList, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const patientNavItems = [
  { title: 'Mis turnos', url: '/patient/appointments', icon: Calendar },
  { title: 'Mis planes', url: '/patient/plans', icon: ClipboardList },
]

export function PatientSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="font-display font-semibold text-primary text-lg tracking-tight group-data-[collapsible=icon]:hidden">
                EvalPro
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/settings">
              {({ isActive }) => (
                <SidebarMenuButton isActive={isActive} tooltip="Configuración">
                  <Settings />
                  <span>Configuración</span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | head -30
```

Expected: sin errores de TypeScript.

---

### Task 2: PatientLayout

**Files:**
- Create: `src/layouts/PatientLayout.tsx`
- Delete: `src/layouts/ClientLayout.tsx`

- [ ] **Step 1: Crear PatientLayout**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PatientSidebar } from '@/components/PatientSidebar'
import { RoleSwitcher } from '@/components/ui/RoleSwitcher'

export function PatientLayout() {
  const { user, loading, profile, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.roles?.includes('PATIENT')) return <Navigate to="/professional/dashboard" replace />

  return (
    <SidebarProvider>
      <PatientSidebar />
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
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Eliminar ClientLayout**

Borrar `src/layouts/ClientLayout.tsx`.

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | head -30
```

Expected: puede fallar por imports rotos en `App.tsx` — se corrigen en Task 8.

---

### Task 3: usePatientId hook

**Files:**
- Create: `src/pages/patient/appointments/hooks/usePatientId.ts`

- [ ] **Step 1: Crear el hook**

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/service'
import { useAuth } from '@/contexts/AuthContext'

async function fetchPatientId(userId: string, organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.patient_id ?? null
}

export function usePatientId() {
  const { user, profile } = useAuth()
  const organizationId = profile?.organization_id ?? null

  return useQuery({
    queryKey: ['patient-id', user?.id, organizationId],
    queryFn: () => fetchPatientId(user!.id, organizationId!),
    enabled: !!user?.id && !!organizationId,
    staleTime: Infinity,
  })
}
```

---

### Task 4: appointments.service.ts (patient)

**Files:**
- Create: `src/pages/patient/appointments/services/appointments.service.ts`

- [ ] **Step 1: Crear el servicio**

```ts
import { supabase } from '@/service'

export interface PatientAppointment {
  appointment_id: string
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  professional: {
    professional_id: string
    user: { full_name: string | null }
  } | null
  location: {
    location_id: string
    name: string
  } | null
}

const PROFESSIONAL_SELECT = `
  professional:professionals!appointments_professional_id_fkey (
    professional_id,
    user:users!professionals_user_id_fkey (full_name)
  )
`

const LOCATION_SELECT = `
  location:locations!appointments_location_id_fkey (
    location_id,
    name
  )
`

export async function getAppointmentsForPatient(patientId: string): Promise<PatientAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`appointment_id, start_at, end_at, status, ${PROFESSIONAL_SELECT}, ${LOCATION_SELECT}`)
    .eq('patient_id', patientId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PatientAppointment[]
}
```

---

### Task 5: AppointmentsPage

**Files:**
- Create: `src/pages/patient/appointments/AppointmentsPage.tsx`

- [ ] **Step 1: Crear la página**

```tsx
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { usePatientId } from './hooks/usePatientId'
import { getAppointmentsForPatient, type PatientAppointment } from './services/appointments.service'

const STATUS_LABELS: Record<PatientAppointment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<PatientAppointment['status'], string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-destructive',
  COMPLETED: 'text-muted-foreground',
}

export function AppointmentsPage() {
  const { data: patientId } = usePatientId()

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => getAppointmentsForPatient(patientId!),
    enabled: !!patientId,
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-on-surface mb-6">Mis turnos</h1>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando turnos…</p>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No tenés turnos agendados
        </div>
      )}

      {!isLoading && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const start = new Date(appt.start_at)
            const end = new Date(appt.end_at)
            const dateStr = start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
            const startStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            const endStr = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={appt.appointment_id}
                className="flex items-start gap-4 px-4 py-4 rounded-xl bg-surface-container border border-outline-variant"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="capitalize">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {startStr} – {endStr}
                  </div>
                  {appt.professional && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      {appt.professional.user.full_name ?? 'Profesional sin nombre'}
                    </div>
                  )}
                  {appt.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {appt.location.name}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium shrink-0 ${STATUS_COLORS[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

### Task 6: PlansPage (mock)

**Files:**
- Create: `src/pages/patient/plans/PlansPage.tsx`

- [ ] **Step 1: Crear la página**

```tsx
const MOCK_PLANS = [
  {
    id: '1',
    title: 'Programa de fortalecimiento lumbar',
    description: 'Ejercicios de estabilización y fortalecimiento del core para reducir el dolor lumbar crónico.',
    type: 'Rehabilitación' as const,
  },
  {
    id: '2',
    title: 'Movilidad de hombro — fase 1',
    description: 'Stretching activo y ejercicios de rango articular progresivo post-lesión.',
    type: 'Rehabilitación' as const,
  },
  {
    id: '3',
    title: 'Fortalecimiento funcional general',
    description: 'Rutina de ejercicios de fuerza adaptada a tu nivel y objetivo de salud general.',
    type: 'Ejercicio' as const,
  },
]

const TYPE_COLORS = {
  Rehabilitación: 'bg-blue-500/10 text-blue-400',
  Ejercicio: 'bg-green-500/10 text-green-400',
}

export function PlansPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-on-surface">Mis planes</h1>
        <span className="text-xs text-muted-foreground">Vista previa — en desarrollo</span>
      </div>

      <div className="space-y-3">
        {MOCK_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="px-4 py-4 rounded-xl bg-surface-container border border-outline-variant space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground">{plan.title}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[plan.type]}`}>
                {plan.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### Task 7: PatientDashboard

**Files:**
- Create: `src/pages/patient/PatientDashboard.tsx`
- Delete: `src/pages/client/ClientDashboard.tsx` y la carpeta `src/pages/client/` si quedó vacía

- [ ] **Step 1: Crear PatientDashboard**

```tsx
import { useNavigate } from 'react-router-dom'
import { Calendar, ClipboardList } from 'lucide-react'

const DASHBOARD_CARDS = [
  {
    title: 'Mis turnos',
    description: 'Tus próximos turnos con el profesional.',
    icon: Calendar,
    href: '/patient/appointments',
  },
  {
    title: 'Mis planes',
    description: 'Tus planes de ejercicio y rehabilitación.',
    icon: ClipboardList,
    href: '/patient/plans',
  },
]

export function PatientDashboard() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-on-surface mb-6">Inicio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DASHBOARD_CARDS.map((card) => (
          <button
            key={card.href}
            onClick={() => navigate(card.href)}
            className="text-left px-5 py-5 rounded-2xl bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors space-y-3"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-on-surface">{card.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Eliminar archivos del área client**

Borrar `src/pages/client/ClientDashboard.tsx` y la carpeta `src/pages/client/`.

---

### Task 8: Actualizar App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Actualizar imports**

Reemplazar:
```tsx
import { ClientLayout } from './layouts/ClientLayout'
import { ClientDashboard } from './pages/client/ClientDashboard'
```

Por:
```tsx
import { PatientLayout } from './layouts/PatientLayout'
import { PatientDashboard } from './pages/patient/PatientDashboard'
import { AppointmentsPage } from './pages/patient/appointments/AppointmentsPage'
import { PlansPage } from './pages/patient/plans/PlansPage'
```

- [ ] **Step 2: Actualizar bloque Patient en Routes**

Reemplazar:
```tsx
{/* Patient */}
<Route element={<RoleAuth allowedRoles={['PATIENT']} redirectTo="/professional/dashboard" />}>
  <Route element={<ClientLayout />}>
    <Route path="/patient/dashboard" element={<ClientDashboard />} />
  </Route>
</Route>
```

Por:
```tsx
{/* Patient */}
<Route element={<RoleAuth allowedRoles={['PATIENT']} redirectTo="/professional/dashboard" />}>
  <Route element={<PatientLayout />}>
    <Route path="/patient/dashboard" element={<PatientDashboard />} />
    <Route path="/patient/appointments" element={<AppointmentsPage />} />
    <Route path="/patient/plans" element={<PlansPage />} />
  </Route>
</Route>
```

- [ ] **Step 3: Verificar build completo**

```bash
npm run build
```

Expected: sin errores de TypeScript ni imports rotos.

- [ ] **Step 4: Verificar en el navegador**

```bash
npm run dev
```

Checklist manual:
- Loguearse como usuario con rol PATIENT
- Sidebar muestra "Mis turnos" y "Mis planes"
- `/patient/dashboard` → dos cards clickeables que navegan correctamente
- `/patient/appointments` → lista de turnos o estado vacío "No tenés turnos agendados"
- `/patient/plans` → 3 cards mock con badges "Rehabilitación" / "Ejercicio"
- Sidebar colapsa con el trigger del header
- `RoleSwitcher` funciona si el usuario tiene múltiples roles
