# Spec: Appointment Wizard — Slot Click + Patient Search Redesign

**Fecha:** 2026-04-03

---

## Resumen

Dos mejoras al wizard de nuevo turno:

1. **Conexión slot → wizard**: click en un slot de `AgendaDayGrid` abre `NewAppointmentDialog` pre-llenado con fecha y hora.
2. **Búsqueda de paciente multi-campo + registro con cuenta**: reemplaza el buscador por nombre y el sub-paso `NewPatientSubStep` por un componente unificado `PatientStep`. Búsqueda por nombre, email o DNI. Al registrar un paciente nuevo se crea automáticamente su cuenta de auth vía invitación.

---

## Arquitectura de identidad

Una persona física tiene **un solo** registro en `users` (identidad: nombre, email, DNI). A partir de ahí puede tener múltiples perfiles según sus roles:

```
users (user_id = auth.uid)
  ├── patients (patient_id, user_id, organization_id)  — perfil como paciente en una org
  └── professionals (professional_id, user_id, organization_id)  — perfil como profesional
```

`patients` y `professionals` son perfiles de rol, no identidades. La misma persona puede ser paciente en la org A y profesional en la org B.

---

## 1. DB Migrations

### 1a. `users` — agregar `identification_number`

```sql
ALTER TABLE users
  ADD COLUMN identification_number text;
```

### 1b. `patients` — limpiar datos personales, `user_id` NOT NULL

```sql
-- Eliminar columnas de datos personales (ahora viven en users)
ALTER TABLE patients
  DROP COLUMN full_name,
  DROP COLUMN email;

-- user_id siempre presente (paciente siempre tiene cuenta)
ALTER TABLE patients
  ALTER COLUMN user_id SET NOT NULL;
```

> Hay 0 filas en `patients` — migración sin riesgo de pérdida de datos.

---

## 2. Edge Function — `invite-patient`

El frontend no puede usar el service role key directamente. La creación de cuenta se delega a una Edge Function.

**Endpoint:** `POST /functions/v1/invite-patient`

**Input:**
```ts
{
  email: string
  full_name: string
  identification_number?: string
  organization_id: string
}
```

**Lógica:**
```
1. Buscar si existe auth user con ese email
   a. Existe → obtener user_id existente
   b. No existe → supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name, identification_number }
      }) → obtener user_id del usuario recién creado
      → INSERT INTO users (user_id, full_name, email, identification_number, organization_id)

2. Verificar si ya existe patients row para (user_id, organization_id)
   - Existe → devolver el patient existente (no duplicar)
   - No existe → INSERT INTO patients (user_id, organization_id)

3. Retornar patient con join a users
```

**Output:**
```ts
{
  patient_id: string
  user_id: string
  organization_id: string
  user: { full_name: string | null, email: string | null, identification_number: string | null }
}
```

El email de invitación que Supabase envía automáticamente menciona que el paciente puede acceder a su historia clínica desde la plataforma.

---

## 3. Patient Search — Servicio

### Tipo `Patient` actualizado

```ts
export interface Patient {
  patient_id: string
  user_id: string
  organization_id: string
  created_at: string
  user: {
    full_name: string | null
    email: string | null
    identification_number: string | null
  }
}
```

### `searchPatients(query: string): Promise<Patient[]>`

Reemplaza `searchPatientsByName`. Join con `users`:

```ts
const { data, error } = await supabase
  .from('patients')
  .select(`
    patient_id, user_id, organization_id, created_at,
    user:users!patients_user_id_fkey (full_name, email, identification_number)
  `)
  .or(`users.full_name.ilike.%${q}%,users.email.ilike.%${q}%,users.identification_number.ilike.%${q}%`)
  .limit(10)
```

### `invitePatient(input)` — reemplaza `createPatient`

Llama a la Edge Function `invite-patient` y retorna `Patient`.

### Eliminar

- `getPatientByEmail` — ya no necesario (la Edge Function maneja el lookup)
- `createPatient` — reemplazado por `invitePatient`

---

## 4. Componente `PatientStep` (reemplaza `PatientSelector` + `NewPatientSubStep`)

### Archivo

`src/pages/agenda/components/PatientStep.tsx`

### Props

```ts
interface Props {
  selectedPatient: Patient | null
  organizationId: string
  onSelect: (patient: Patient) => void
  onClear: () => void
}
```

### Estados internos

| Estado | Descripción |
|---|---|
| `idle` | Input vacío |
| `searching` | Query activo, debounce en curso o resultados en dropdown |
| `not_found` | Query sin resultados |
| `registering` | Usuario eligió registrar paciente nuevo |
| `selected` | Paciente seleccionado — muestra card |

### Flow

```
idle ──[tipea]──▶ searching ──[resultados]──▶ click ──▶ selected
                              └──[sin resultados]──▶ not_found
                                                       └──[Registrar]──▶ registering
registering ──[invita+crea]──▶ selected
registering / not_found ──[Volver]──▶ idle
selected ──[Cambiar]──▶ idle
```

### Estado `idle` / `searching`

- Input único: `placeholder="Buscar por nombre, email o DNI…"`
- Ícono `Search` a la izquierda
- Debounce 300ms → llama `searchPatients(query)`
- Dropdown: cada fila muestra `user.full_name` + `user.email` + `user.identification_number`
- Click fuera cierra el dropdown

### Estado `not_found`

Inline debajo del input:

```
No encontramos ningún paciente con esa búsqueda.
[Registrar paciente nuevo]   [× Limpiar]
```

### Estado `registering`

Form inline con tres campos:

| Campo | Tipo | Obligatorio |
|---|---|---|
| Email | `type="email"` | Sí |
| Nombre completo | text | Sí |
| DNI / N° identificación | text | No |

Info text debajo del campo email:

> *El paciente recibirá un email para activar su cuenta y acceder a su historia clínica.*

Si el query tenía forma de email (contiene `@`), pre-llenar el campo email.

Botones: `Volver` (→ `idle`) | `Registrar paciente` (llama `invitePatient`).

Toast pattern: `toast.loading` / `toast.success` / `toast.error` con id `'invite-patient'`.

### Estado `selected`

```
[user.full_name]                          [Cambiar]
[user.email · user.identification_number]
```

---

## 5. `NewAppointmentDialog` — Cambios

### Props nuevas

```ts
interface Props {
  professionalId: string
  defaultDate?: Date        // si tiene hora != 00:00 → pre-llena startTime y endTime
  open?: boolean            // control externo
  onOpenChange?: (v: boolean) => void
  trigger?: React.ReactNode
}
```

### Control de apertura

```ts
const [internalOpen, setInternalOpen] = useState(false)
const isOpen = open ?? internalOpen
const handleOpenChange = (v: boolean) => {
  onOpenChange?.(v)
  setInternalOpen(v)
  if (!v) handleClose()
}
```

### Pre-llenado de hora desde `defaultDate`

Si `defaultDate` tiene horas/minutos distintos de cero:

```ts
function toTimeStr(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

defaultValues: {
  date: defaultDate?.toISOString().split('T')[0] ?? '',
  startTime: defaultDate && (defaultDate.getHours() || defaultDate.getMinutes())
    ? toTimeStr(defaultDate) : '',
  endTime: defaultDate && (defaultDate.getHours() || defaultDate.getMinutes())
    ? toTimeStr(new Date(defaultDate.getTime() + 30 * 60_000)) : '',
}
```

### Sección de paciente

Reemplazar `showNewPatient` + `PatientSelector` + `NewPatientSubStep` por:

```tsx
<PatientStep
  selectedPatient={selectedPatient}
  organizationId={profile!.organization_id!}
  onSelect={(p) => { setSelectedPatient(p); setPatientError(false) }}
  onClear={() => setSelectedPatient(null)}
/>
```

Eliminar el estado `showNewPatient`. El form de fecha/hora no necesita ocultarse.

### Invalidación de queries al crear turno

```ts
queryClient.invalidateQueries({ queryKey: ['appointments', professionalId] })
queryClient.invalidateQueries({ queryKey: ['appointments-day', professionalId] })
```

---

## 6. `AgendaPage` — Conectar slot click (view=dia)

```tsx
const [slotDate, setSlotDate] = useState<Date | null>(null)

// En view=dia:
<AgendaDayGrid
  date={date}
  professionalId={professionalId}
  onSlotClick={setSlotDate}
/>
{slotDate !== null && (
  <NewAppointmentDialog
    key={slotDate.toISOString()}
    professionalId={professionalId}
    defaultDate={slotDate}
    open={true}
    onOpenChange={(v) => { if (!v) setSlotDate(null) }}
  />
)}
```

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| Supabase migration | `users` + `identification_number`; `patients` − `full_name` − `email`, `user_id` NOT NULL |
| Supabase Edge Function | Nueva: `invite-patient` |
| `patients.service.ts` | Tipo + `searchPatients` + `invitePatient`, eliminar `createPatient`/`getPatientByEmail` |
| `PatientStep.tsx` | Nuevo componente |
| `PatientSelector.tsx` | Eliminar |
| `NewPatientSubStep.tsx` | Eliminar |
| `NewAppointmentDialog.tsx` | Props `open`/`onOpenChange` + pre-llenado hora + usar `PatientStep` |
| `AgendaPage.tsx` | Estado `slotDate` + slot click wiring |
| `AppointmentList.tsx` | Actualizar acceso a `patient.user.full_name` en lugar de `patient.full_name` |
| `AgendaDayGrid.tsx` | Actualizar acceso a `appt.patient?.user.full_name` |
