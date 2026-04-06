# Spec: Área del Paciente — Layout, Mis Turnos, Mis Planes

**Fecha:** 2026-04-04
**Estado:** Aprobado

---

## Objetivo

Implementar el área del paciente con sidebar de navegación y dos páginas iniciales: Mis Turnos (datos reales) y Mis Planes (mock). Reemplazar la nomenclatura `Client*` por `Patient*` en toda la capa de archivos del paciente.

---

## Renombres

| Antes | Después |
|---|---|
| `src/layouts/ClientLayout.tsx` | `src/layouts/PatientLayout.tsx` |
| `src/components/AppSidebar.tsx` | sin cambios (es del profesional) |
| `src/pages/client/ClientDashboard.tsx` | `src/pages/patient/PatientDashboard.tsx` |

`App.tsx` actualiza la importación de `ClientLayout` → `PatientLayout` y `ClientDashboard` → `PatientDashboard`.

---

## Archivos nuevos

```
src/
  components/
    PatientSidebar.tsx
  layouts/
    PatientLayout.tsx
  pages/
    patient/
      PatientDashboard.tsx
      appointments/
        AppointmentsPage.tsx
        services/
          appointments.service.ts
      plans/
        PlansPage.tsx
```

---

## PatientLayout

Mismo patrón que `ProfesionalLayout`:
- `SidebarProvider` wrapping todo
- `PatientSidebar` a la izquierda
- Header con `SidebarTrigger`, email del usuario, `RoleSwitcher`, botón cerrar sesión
- `Outlet` en el main

---

## PatientSidebar

Componente análogo a `AppSidebar` pero con nav del paciente. Items:

| Label | Ruta | Icono |
|---|---|---|
| Mis turnos | `/patient/appointments` | `Calendar` |
| Mis planes | `/patient/plans` | `ClipboardList` |

Footer: link a `/settings` con icono `Settings`.

Usa los mismos primitivos shadcn (`Sidebar`, `SidebarMenu`, etc.).

---

## PatientDashboard (`/patient/dashboard`)

Página de inicio del paciente. Muestra dos cards simples (una por sección). Las cards son navegables (click → ruta correspondiente). En el futuro contendrán estadísticas o resumen de cada sección.

Cards:
- **Mis turnos** — "Tus próximos turnos" (link → `/patient/appointments`)
- **Mis planes** — "Tus planes de ejercicio y rehabilitación" (link → `/patient/plans`)

---

## Routing en App.tsx

```
/patient/dashboard      → PatientDashboard
/patient/appointments   → AppointmentsPage
/patient/plans          → PlansPage
```

Todas bajo `PatientLayout` + `RoleAuth allowedRoles={['PATIENT']}`.

---

## AppointmentsPage (`/patient/appointments`)

### Hook: `usePatientId`

Resuelve `auth.user.id → users → patients.patient_id` filtrando por `organization_id` del usuario logueado (un mismo usuario puede tener múltiples filas en `patients`, una por organización). `staleTime: Infinity`. Análogo a `useProfessionalId`.

### Service: `getAppointmentsForPatient(patientId)`

Query sobre `appointments` con joins:
- `professionals → users` (para `full_name` del profesional)
- `locations` (nullable, para nombre del lugar)

Ordenado por `start_at` ascendente.

### UI

Lista de turnos. Por turno:
- Fecha y hora (start_at / end_at) — formato `es-AR`
- Nombre del profesional
- Location (si existe; si no, omitir o mostrar "Sin location")
- Badge de estado (PENDING / CONFIRMED / CANCELLED / COMPLETED) con colores equivalentes a los de `AppointmentList` del profesional

Estado vacío: "No tenés turnos agendados".
Estado de carga: skeleton o texto "Cargando turnos…".

---

## PlansPage (`/patient/plans`)

Mock estático. Sin DB. Muestra 2–3 cards hardcodeadas con:
- Título del plan (ej: "Programa de fortalecimiento lumbar")
- Descripción breve
- Badge de tipo: `Ejercicio` | `Rehabilitación`

Indicador visual de que es una feature en construcción (texto discreto, sin bloquear la UI).

---

## Decisiones de diseño

- `PatientSidebar` es independiente de `AppSidebar`: ambos componentes crecerán de forma separada.
- `usePatientId` sigue el mismo patrón que `useProfessionalId` para consistencia.
- Los datos de "Mis planes" son mock en esta iteración; la tabla de planes se diseñará en una spec separada cuando se defina el modelo (plan explícito del profesional + rutinas/indicaciones).
- No se crean tablas nuevas en esta iteración.
