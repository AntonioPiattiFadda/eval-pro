# Spec: New Appointment Wizard

**Date:** 2026-04-02  
**Status:** Approved

---

## Overview

A dialog wizard that lets a professional (or admin) create a new appointment and assign it to a patient. Triggered from two entry points: the professional's agenda and a future admin scheduling table. The wizard always receives `professionalId` as a prop since the context always comes from a specific professional's row or calendar.

---

## Entry Points

| Context | Trigger | Props passed |
|---|---|---|
| Professional's agenda | Click on empty slot | `professionalId` (own), `defaultDate` |
| Admin's scheduling table | Button on a professional's row | `professionalId` (selected pro), `defaultDate?` |

---

## Component API

```typescript
interface NewAppointmentDialogProps {
  professionalId: string  // always required — comes from the table/calendar context
  defaultDate?: Date      // pre-fills date/time fields if coming from a calendar slot
  trigger?: ReactNode     // customizable trigger button
}
```

`booked_by` is always taken from `useAuth()` — records who created the appointment (professional or admin).

---

## Wizard Flow

The dialog has a **single screen** with an inline patient sub-step.

### Main screen

```
┌─────────────────────────────────┐
│  Nuevo Turno                    │
│                                 │
│  Paciente                       │
│  [Buscar paciente por nombre ▼] │
│  + Paciente nuevo               │
│                                 │
│  Fecha         Inicio    Fin    │
│  [📅 fecha]   [🕐 hora] [🕐 hora]│
│                                 │
│         [Cancelar] [Confirmar]  │
└─────────────────────────────────┘
```

### Patient sub-step (replaces the patient selector inline)

**Step 1 — Email lookup:**
```
  Email
  [email@ejemplo.com        ]
  [Buscar]
  ← Volver
```

- On search: query `patients` joined with `users` by email.
- **Found:** auto-select the patient, close sub-step, return to main screen.
- **Not found:** show Step 2.

**Step 2 — Create patient:**
```
  No encontramos ese email.
  Nombre completo
  [                         ]
  [Crear paciente]
  ← Volver
```

- Email is pre-filled from Step 1 (not shown again).
- On create: inserts into `patients` (with `full_name`, `email`, `user_id = null`).
- On success: auto-selects the new patient, returns to main screen.

---

## Database Changes

### `patients` table migration

```sql
ALTER TABLE patients
  ADD COLUMN full_name text,
  ADD COLUMN email     text,
  ALTER COLUMN user_id DROP NOT NULL;
```

`user_id` becomes nullable — patients can exist as clinical records without a login account. A future feature will handle sending an invite and linking the auth account.

---

## Data Flow on Confirm

1. Create `appointment`:
   - `professional_id` from props
   - `start_at`, `end_at` from form
   - `booked_by` from auth context
   - `status = PENDING`
2. Create `appointment_sessions` row:
   - `appointment_id` from step 1
   - `session_id`: for now, a `session` row is **not** created at booking time — the clinical session is created when the appointment actually starts. `appointment_sessions` links to a session once created.

> **Open question:** Should a `session` row be created at booking time with a `PENDING` status, or only when the appointment starts? Decision deferred — the appointment alone is sufficient for scheduling.

---

## File Structure

```
src/pages/agenda/
  components/
    NewAppointmentDialog.tsx   ← main wizard dialog
    PatientSelector.tsx        ← dropdown to search existing patients
    NewPatientSubStep.tsx      ← inline email lookup + create form
  services/
    appointments.service.ts    ← createAppointment(), getPatientByEmail()
    patients.service.ts        ← createPatient()
```

---

## Error Handling

- Email lookup: debounced or on-submit. Show inline "No encontrado" — never an error toast.
- Patient create failure: `toast.error(err.message)` with loading toast pattern.
- Appointment create failure: `toast.error(err.message)` with loading toast pattern.
- Form validation (empty fields, invalid time range): inline messages via react-hook-form + Zod. No toasts for validation.
