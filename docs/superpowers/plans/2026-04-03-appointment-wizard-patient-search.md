# Appointment Wizard — Slot Click + Patient Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect slot click in AgendaDayGrid to open NewAppointmentDialog pre-filled with date/time, and replace the patient selector with a unified multi-field search that creates patient accounts via Supabase invite.

**Architecture:** One person = one `users` record (full_name, email, identification_number, auth UUID). `patients` is a role-profile (user_id NOT NULL, organization_id) — a person can be a patient in many orgs. Patient creation sends a Supabase auth invite; the Edge Function handles the service-role operation server-side. Search is org-scoped via an RPC function joining `patients → users`.

**Tech Stack:** React 19, TypeScript, Supabase (PostgREST + Edge Functions + Auth), TanStack Query, react-hook-form + Zod, Sonner toasts, shadcn/ui, Deno (Edge Function runtime)

> **Git:** No ejecutar ningún comando de git. El usuario maneja todos los commits manualmente.

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260403000001_identification_number_and_clean_patients.sql` |
| Create | `supabase/migrations/20260403000002_search_patients_rpc.sql` |
| Create | `supabase/functions/invite-patient/index.ts` |
| Modify | `src/pages/agenda/services/patients.service.ts` |
| Modify | `src/pages/agenda/services/appointments.service.ts` |
| Create | `src/pages/agenda/components/PatientStep.tsx` |
| Modify | `src/pages/agenda/components/NewAppointmentDialog.tsx` |
| Modify | `src/pages/agenda/AgendaPage.tsx` |
| Modify | `src/pages/agenda/components/AppointmentList.tsx` |
| Modify | `src/pages/agenda/components/AgendaDayGrid.tsx` |
| Delete | `src/pages/agenda/components/PatientSelector.tsx` |
| Delete | `src/pages/agenda/components/NewPatientSubStep.tsx` |

---

## Task 1: DB Migration — `identification_number` + clean `patients`

**Files:**
- Create: `supabase/migrations/20260403000001_identification_number_and_clean_patients.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add identification_number to users (identity data lives here, not on patients)
ALTER TABLE users
  ADD COLUMN identification_number text;

-- Remove personal data columns from patients (they join through users now)
ALTER TABLE patients
  DROP COLUMN full_name,
  DROP COLUMN email;

-- patients always have a linked user account (created at registration)
ALTER TABLE patients
  ALTER COLUMN user_id SET NOT NULL;
```

- [ ] **Step 2: Apply migration via MCP**

Use `mcp__supabase__apply_migration` with the SQL above. Name: `identification_number_and_clean_patients`.

- [ ] **Step 3: Verify**

Run via `mcp__supabase__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'identification_number';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'patients' AND column_name IN ('full_name', 'email');

SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'user_id';
```

Expected: `identification_number` exists on users, `full_name`/`email` absent from patients, `user_id` is NOT NULL.

---

## Task 2: DB Function — `search_patients` RPC

**Files:**
- Create: `supabase/migrations/20260403000002_search_patients_rpc.sql`

- [ ] **Step 1: Create migration file**

```sql
CREATE OR REPLACE FUNCTION search_patients(p_org_id uuid, p_query text)
RETURNS TABLE (
  patient_id uuid,
  user_id     uuid,
  organization_id uuid,
  created_at  timestamptz,
  full_name   text,
  email       text,
  identification_number text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.patient_id,
    p.user_id,
    p.organization_id,
    p.created_at,
    u.full_name,
    u.email,
    u.identification_number
  FROM patients p
  JOIN users u ON u.user_id = p.user_id
  WHERE p.organization_id = p_org_id
    AND (
      u.full_name            ILIKE '%' || p_query || '%'
      OR u.email             ILIKE '%' || p_query || '%'
      OR u.identification_number ILIKE '%' || p_query || '%'
    )
  ORDER BY u.full_name
  LIMIT 10;
$$;
```

- [ ] **Step 2: Apply migration**

Use `mcp__supabase__apply_migration`. Name: `search_patients_rpc`.

- [ ] **Step 3: Verify**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'search_patients';
```

---

## Task 3: Edge Function — `invite-patient`

**Files:**
- Create: `supabase/functions/invite-patient/index.ts`

The frontend cannot use the Supabase service role key. This Edge Function handles: checking if user exists, sending invite if new, creating the `patients` row.

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/invite-patient/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, full_name, identification_number, organization_id } =
      await req.json() as {
        email: string
        full_name: string
        identification_number?: string
        organization_id: string
      }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      userId = existingUser.user_id
    } else {
      // Invite new user — Supabase sends the activation email
      const { data: invited, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          data: { full_name, identification_number: identification_number ?? null },
        })
      if (inviteError) throw inviteError
      userId = invited.user.id

      // Create public.users record immediately (no trigger exists)
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({
          user_id: userId,
          email: normalizedEmail,
          full_name,
          identification_number: identification_number ?? null,
          organization_id,
        })
      if (userInsertError) throw userInsertError
    }

    // 2. Check if patient already exists in this org (avoid duplicates)
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select(`
        patient_id, user_id, organization_id, created_at,
        user:users!patients_user_id_fkey (full_name, email, identification_number)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organization_id)
      .maybeSingle()

    if (existingPatient) {
      return new Response(JSON.stringify(existingPatient), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create patient row
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({ user_id: userId, organization_id })
      .select(`
        patient_id, user_id, organization_id, created_at,
        user:users!patients_user_id_fkey (full_name, email, identification_number)
      `)
      .single()
    if (patientError) throw patientError

    return new Response(JSON.stringify(patient), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Deploy the Edge Function**

Use `mcp__supabase__deploy_edge_function` with name `invite-patient` and the file content above.

---

## Task 4: Update `patients.service.ts`

**Files:**
- Modify: `src/pages/agenda/services/patients.service.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { supabase } from '@/service'

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

export async function searchPatients(
  query: string,
  organizationId: string
): Promise<Patient[]> {
  if (!query.trim()) return []
  const { data, error } = await supabase.rpc('search_patients', {
    p_org_id: organizationId,
    p_query: query.trim(),
  })
  if (error) throw error
  // RPC returns flat rows — reshape to match Patient interface
  return (data ?? []).map((row: {
    patient_id: string
    user_id: string
    organization_id: string
    created_at: string
    full_name: string | null
    email: string | null
    identification_number: string | null
  }) => ({
    patient_id: row.patient_id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    created_at: row.created_at,
    user: {
      full_name: row.full_name,
      email: row.email,
      identification_number: row.identification_number,
    },
  }))
}

export async function invitePatient(input: {
  email: string
  full_name: string
  identification_number?: string
  organization_id: string
}): Promise<Patient> {
  const { data, error } = await supabase.functions.invoke('invite-patient', {
    body: input,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data as Patient
}
```

---

## Task 5: Update `appointments.service.ts`

Patient data now lives in `users` via a join. Update the `Appointment` type and both queries.

**Files:**
- Modify: `src/pages/agenda/services/appointments.service.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { supabase } from '@/service'

export interface Appointment {
  appointment_id: string
  professional_id: string | null
  patient_id: string | null
  organization_id: string
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  booked_by: string | null
  created_at: string
  patient?: {
    patient_id: string
    user_id: string
    user: {
      full_name: string | null
      email: string | null
    }
  } | null
}

const PATIENT_SELECT = `
  patient:patients!appointments_patient_id_fkey (
    patient_id,
    user_id,
    user:users!patients_user_id_fkey (full_name, email)
  )
`

export async function createAppointment(input: {
  professional_id: string
  patient_id: string
  organization_id: string
  start_at: string
  end_at: string
  booked_by: string
}): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...input, status: 'PENDING' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAppointmentsForDay(
  professionalId: string,
  date: Date
): Promise<Appointment[]> {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, ${PATIENT_SELECT}`)
    .eq('professional_id', professionalId)
    .gte('start_at', start.toISOString())
    .lte('start_at', end.toISOString())
    .order('start_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAppointmentsForProfessional(
  professionalId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, ${PATIENT_SELECT}`)
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
```

---

## Task 6: Create `PatientStep.tsx`

**Files:**
- Create: `src/pages/agenda/components/PatientStep.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, ArrowLeft, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { searchPatients, invitePatient, type Patient } from '../services/patients.service'

type State = 'idle' | 'searching' | 'not_found' | 'registering'

interface Props {
  selectedPatient: Patient | null
  organizationId: string
  onSelect: (patient: Patient) => void
  onClear: () => void
}

export function PatientStep({ selectedPatient, organizationId, onSelect, onClear }: Props) {
  const [state, setState] = useState<State>('idle')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [identificationNumber, setIdentificationNumber] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
      setResults([])
      setDropdownOpen(false)
      setState('idle')
      return
    }
    setState('searching')
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current
      setLoading(true)
      try {
        const data = await searchPatients(value, organizationId)
        if (seq !== seqRef.current) return
        setResults(data)
        if (data.length === 0) {
          setState('not_found')
          setDropdownOpen(false)
        } else {
          setState('searching')
          setDropdownOpen(true)
        }
      } catch {
        if (seq === seqRef.current) setState('idle')
      } finally {
        if (seq === seqRef.current) setLoading(false)
      }
    }, 300)
  }

  const handleSelectFromDropdown = (patient: Patient) => {
    setDropdownOpen(false)
    setQuery('')
    onSelect(patient)
  }

  const handleStartRegistering = () => {
    // Pre-fill email if query looks like an email
    if (query.includes('@')) setEmail(query)
    setFullName('')
    setIdentificationNumber('')
    setState('registering')
  }

  const handleBackToIdle = () => {
    setQuery('')
    setResults([])
    setState('idle')
  }

  const toastId = 'invite-patient'
  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: () =>
      invitePatient({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        identification_number: identificationNumber.trim() || undefined,
        organization_id: organizationId,
      }),
    onMutate: () => { toast.loading('Registrando paciente…', { id: toastId }) },
    onSuccess: (patient) => {
      toast.success('Paciente registrado. Se envió el email de activación.', { id: toastId })
      setState('idle')
      setQuery('')
      onSelect(patient)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  // Selected state
  if (selectedPatient) {
    const { full_name, email: patEmail, identification_number } = selectedPatient.user
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant">
        <div>
          <p className="text-sm font-medium text-foreground">{full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {patEmail ?? '—'}
            {identification_number ? ` · ${identification_number}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cambiar
        </button>
      </div>
    )
  }

  // Registering state
  if (state === 'registering') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleBackToIdle}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a buscar
        </button>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            autoFocus={!email}
          />
          <p className="text-xs text-muted-foreground">
            El paciente recibirá un email para activar su cuenta y acceder a su historia clínica.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Nombre completo</Label>
          <Input
            id="reg-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre y apellido"
            autoFocus={!!email}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-dni">
            DNI / N° identificación
            <span className="text-muted-foreground ml-1 font-normal">(opcional)</span>
          </Label>
          <Input
            id="reg-dni"
            value={identificationNumber}
            onChange={(e) => setIdentificationNumber(e.target.value)}
            placeholder="12345678"
          />
        </div>

        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => invite()}
          disabled={inviting || !email.trim() || !fullName.trim()}
        >
          {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
          Registrar paciente
        </Button>
      </div>
    )
  }

  // Search state (idle / searching / not_found)
  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder="Buscar por nombre, email o DNI…"
          className="pl-8"
        />
      </div>

      {dropdownOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-outline-variant bg-surface-container shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => handleSelectFromDropdown(p)}
              className={cn(
                'w-full flex flex-col items-start px-3 py-2 text-sm',
                'hover:bg-surface-container-high transition-colors'
              )}
            >
              <span className="font-medium text-foreground">{p.user.full_name ?? '—'}</span>
              <span className="text-xs text-muted-foreground">
                {p.user.email ?? '—'}
                {p.user.identification_number ? ` · ${p.user.identification_number}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {state === 'not_found' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            No encontramos ningún paciente con esa búsqueda.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex items-center gap-1.5"
              onClick={handleStartRegistering}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Registrar paciente nuevo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleBackToIdle}
            >
              × Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Task 7: Update `NewAppointmentDialog.tsx`

Add external `open`/`onOpenChange` control, time pre-fill from `defaultDate`, replace patient components with `PatientStep`.

**Files:**
- Modify: `src/pages/agenda/components/NewAppointmentDialog.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { createAppointment } from '../services/appointments.service'
import { type Patient } from '../services/patients.service'
import { PatientStep } from './PatientStep'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  startTime: z.string().min(1, 'Requerido'),
  endTime: z.string().min(1, 'Requerido'),
}).refine((d) => d.startTime < d.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endTime'],
})

type FormValues = z.infer<typeof schema>

function pad(n: number) { return String(n).padStart(2, '0') }
function toTimeStr(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function hasTime(d: Date) { return d.getHours() !== 0 || d.getMinutes() !== 0 }

interface Props {
  professionalId: string
  defaultDate?: Date
  open?: boolean
  onOpenChange?: (v: boolean) => void
  trigger?: React.ReactNode
}

export function NewAppointmentDialog({
  professionalId,
  defaultDate,
  open,
  onOpenChange,
  trigger,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientError, setPatientError] = useState(false)
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const handleOpenChange = (v: boolean) => {
    onOpenChange?.(v)
    setInternalOpen(v)
    if (!v) handleClose()
  }

  const dateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : ''
  const startTimeStr = defaultDate && hasTime(defaultDate) ? toTimeStr(defaultDate) : ''
  const endTimeStr = defaultDate && hasTime(defaultDate)
    ? toTimeStr(new Date(defaultDate.getTime() + 30 * 60_000))
    : ''

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: dateStr, startTime: startTimeStr, endTime: endTimeStr },
  })

  const handleClose = () => {
    setSelectedPatient(null)
    setPatientError(false)
    reset({ date: dateStr, startTime: startTimeStr, endTime: endTimeStr })
  }

  const toastId = 'create-appointment'

  const { mutate, isPending } = useMutation({
    mutationFn: ({ values, patient }: { values: FormValues; patient: Patient }) => {
      const start_at = new Date(`${values.date}T${values.startTime}`).toISOString()
      const end_at   = new Date(`${values.date}T${values.endTime}`).toISOString()
      return createAppointment({
        professional_id: professionalId,
        patient_id: patient.patient_id,
        organization_id: profile!.organization_id!,
        start_at,
        end_at,
        booked_by: user!.id,
      })
    },
    onMutate: () => { toast.loading('Creando turno…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Turno creado', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['appointments', professionalId] })
      queryClient.invalidateQueries({ queryKey: ['appointments-day', professionalId] })
      handleOpenChange(false)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  const onSubmit = (values: FormValues) => {
    if (!selectedPatient) { setPatientError(true); return }
    setPatientError(false)
    mutate({ values, patient: selectedPatient })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <CalendarPlus />
            Nuevo turno
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <CalendarPlus className="h-4 w-4 text-primary" />
            </div>
            Nuevo Turno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <PatientStep
              selectedPatient={selectedPatient}
              organizationId={profile!.organization_id!}
              onSelect={(p) => { setSelectedPatient(p); setPatientError(false) }}
              onClear={() => setSelectedPatient(null)}
            />
            {patientError && (
              <p className="text-xs text-destructive">Seleccioná un paciente</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-date">Fecha</Label>
            <Input id="appt-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appt-start">Inicio</Label>
              <Input id="appt-start" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-end">Fin</Label>
              <Input id="appt-end" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Task 8: Wire Slot Click in `AgendaPage.tsx`

**Files:**
- Modify: `src/pages/agenda/AgendaPage.tsx`

- [ ] **Step 1: Update the file**

Replace the `view === 'dia'` branch:

```typescript
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AgendaToolbar } from './AgendaToolbar'
import { AgendaDayNav } from './components/AgendaDayNav'
import { AgendaDayGrid } from './components/AgendaDayGrid'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import { AppointmentList } from './components/AppointmentList'
import { useProfessionalId } from './hooks/useProfessionalId'

function parseDate(s: string | null): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function AgendaPage() {
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view') ?? 'mes'
  const date = parseDate(searchParams.get('date'))
  const { data: professionalId, isLoading } = useProfessionalId()
  const [slotDate, setSlotDate] = useState<Date | null>(null)

  if (view === 'dia') {
    return (
      <div className="flex flex-col h-full overflow-hidden min-h-0">
        <AgendaToolbar />
        <AgendaDayNav />
        {professionalId && (
          <>
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
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AgendaToolbar />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Agenda</h2>
          {professionalId && (
            <NewAppointmentDialog professionalId={professionalId} />
          )}
        </div>

        {isLoading && (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        )}

        {!isLoading && !professionalId && (
          <div className="text-sm text-muted-foreground">
            No se encontró un perfil profesional para este usuario.
          </div>
        )}

        {professionalId && (
          <AppointmentList professionalId={professionalId} />
        )}
      </div>
    </div>
  )
}
```

---

## Task 9: Update Patient Name Access in `AppointmentList` and `AgendaDayGrid`

Patient data is now at `appt.patient?.user.full_name` instead of `appt.patient?.full_name`.

**Files:**
- Modify: `src/pages/agenda/components/AppointmentList.tsx:59`
- Modify: `src/pages/agenda/components/AgendaDayGrid.tsx:179,185`

- [ ] **Step 1: Update `AppointmentList.tsx` line 59**

Change:
```tsx
<span className="truncate">{appt.patient?.full_name ?? 'Paciente sin nombre'}</span>
```
To:
```tsx
<span className="truncate">{appt.patient?.user.full_name ?? 'Paciente sin nombre'}</span>
```

- [ ] **Step 2: Update `AgendaDayGrid.tsx` compact view (line ~179)**

Change:
```tsx
{startStr} {appt.patient?.full_name ?? 'Sin nombre'}
```
To:
```tsx
{startStr} {appt.patient?.user.full_name ?? 'Sin nombre'}
```

- [ ] **Step 3: Update `AgendaDayGrid.tsx` full view (line ~185)**

Change:
```tsx
<p className="text-xs font-medium truncate leading-tight">
  {appt.patient?.full_name ?? 'Sin nombre'}
</p>
```
To:
```tsx
<p className="text-xs font-medium truncate leading-tight">
  {appt.patient?.user.full_name ?? 'Sin nombre'}
</p>
```

---

## Task 10: Delete Old Components + Verify Build

**Files:**
- Delete: `src/pages/agenda/components/PatientSelector.tsx`
- Delete: `src/pages/agenda/components/NewPatientSubStep.tsx`

- [ ] **Step 1: Delete old files**

```bash
rm src/pages/agenda/components/PatientSelector.tsx
rm src/pages/agenda/components/NewPatientSubStep.tsx
```

- [ ] **Step 2: Verify TypeScript build passes**

```bash
npm run build
```

Expected: no TypeScript errors. If errors appear, they will point to stale imports — fix them before committing.

- [ ] **Step 3: Manual smoke test**

1. Run `npm run dev`
2. Navigate to Agenda → Vista Día
3. Click any slot → dialog opens with date and time pre-filled
4. Search a patient by name, email, or DNI → results appear
5. Select a patient → card shown
6. Submit → turno created, grid updates

