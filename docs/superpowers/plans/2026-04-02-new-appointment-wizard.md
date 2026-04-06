# New Appointment Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Nuevo turno" button to the agenda that opens a wizard to book an appointment for an existing or new patient, and display existing appointments in a basic list.

**Architecture:** DB migration adds `full_name`/`email` to `patients` and `patient_id` to `appointments`. Services handle DB calls. Three focused components compose the wizard (`PatientSelector`, `NewPatientSubStep`, `NewAppointmentDialog`). A `useProfessionalId` hook resolves the logged-in user's `professional_id`. `AgendaPage` renders the trigger button and appointment list.

**Tech Stack:** React 19, TypeScript, Supabase, TanStack Query v5, react-hook-form + Zod, Sonner toasts, shadcn/ui (Dialog, Input, Label, Button from `@/components/ui/`), lucide-react.

---

## File Map

| Action | File |
|---|---|
| Create | `src/pages/agenda/services/appointments.service.ts` |
| Create | `src/pages/agenda/services/patients.service.ts` |
| Create | `src/pages/agenda/hooks/useProfessionalId.ts` |
| Create | `src/pages/agenda/components/NewPatientSubStep.tsx` |
| Create | `src/pages/agenda/components/PatientSelector.tsx` |
| Create | `src/pages/agenda/components/NewAppointmentDialog.tsx` |
| Create | `src/pages/agenda/components/AppointmentList.tsx` |
| Modify | `src/pages/agenda/AgendaPage.tsx` |

---

## Task 1: DB Migration

**Files:**
- Supabase migration via MCP

- [ ] **Step 1: Apply migration**

```sql
-- Add fields to patients and make user_id nullable
ALTER TABLE patients
  ADD COLUMN full_name text,
  ADD COLUMN email     text,
  ALTER COLUMN user_id DROP NOT NULL;

-- Add patient_id to appointments so we can show patient without a session
ALTER TABLE appointments
  ADD COLUMN patient_id uuid REFERENCES patients(patient_id) ON DELETE SET NULL;
```

- [ ] **Step 2: Verify**

Run in Supabase MCP:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('patients', 'appointments')
ORDER BY table_name, ordinal_position;
```

Expected: `patients` has `full_name`, `email` (nullable); `user_id` is nullable. `appointments` has `patient_id` (nullable).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add full_name/email to patients, patient_id to appointments"
```

---

## Task 2: Patient Service

**Files:**
- Create: `src/pages/agenda/services/patients.service.ts`

- [ ] **Step 1: Create the file**

```typescript
import { supabase } from '@/service'

export interface Patient {
  patient_id: string
  full_name: string | null
  email: string | null
  user_id: string | null
  created_at: string
}

export async function searchPatientsByName(query: string): Promise<Patient[]> {
  if (!query.trim()) return []
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id, full_name, email, user_id, created_at')
    .ilike('full_name', `%${query}%`)
    .limit(10)
  if (error) throw error
  return data ?? []
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id, full_name, email, user_id, created_at')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createPatient(input: {
  full_name: string
  email: string
}): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert({ full_name: input.full_name, email: input.email.toLowerCase().trim() })
    .select('patient_id, full_name, email, user_id, created_at')
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/services/patients.service.ts
git commit -m "feat: add patients service (search, lookup by email, create)"
```

---

## Task 3: Appointments Service

**Files:**
- Create: `src/pages/agenda/services/appointments.service.ts`

- [ ] **Step 1: Create the file**

```typescript
import { supabase } from '@/service'
import type { Patient } from './patients.service'

export interface Appointment {
  appointment_id: string
  professional_id: string | null
  patient_id: string | null
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  booked_by: string | null
  created_at: string
  patient?: Pick<Patient, 'full_name' | 'email'> | null
}

export async function createAppointment(input: {
  professional_id: string
  patient_id: string
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

export async function getAppointmentsForProfessional(
  professionalId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(full_name, email)')
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    patient: row.patients as Pick<Patient, 'full_name' | 'email'> | null,
  }))
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/services/appointments.service.ts
git commit -m "feat: add appointments service (create, list for professional)"
```

---

## Task 4: useProfessionalId Hook

**Files:**
- Create: `src/pages/agenda/hooks/useProfessionalId.ts`

The logged-in user can have multiple specialties (multiple rows in `professionals`). For now we return the first one. A future feature will let the user select specialty context.

- [ ] **Step 1: Create the file**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/service'
import { useAuth } from '@/contexts/AuthContext'

async function fetchProfessionalId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('professional_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.professional_id ?? null
}

export function useProfessionalId() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['professional-id', user?.id],
    queryFn: () => fetchProfessionalId(user!.id),
    enabled: !!user?.id,
    staleTime: Infinity,
  })
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/hooks/useProfessionalId.ts
git commit -m "feat: add useProfessionalId hook"
```

---

## Task 5: NewPatientSubStep Component

**Files:**
- Create: `src/pages/agenda/components/NewPatientSubStep.tsx`

This component replaces the PatientSelector inline. Two internal steps: email lookup → create form.

- [ ] **Step 1: Create the file**

```typescript
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getPatientByEmail,
  createPatient,
  type Patient,
} from '../services/patients.service'

interface Props {
  onSelect: (patient: Patient) => void
  onBack: () => void
}

export function NewPatientSubStep({ onSelect, onBack }: Props) {
  const [step, setStep] = useState<'email' | 'create'>('email')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleEmailSearch = async () => {
    if (!email.trim()) return
    setLookingUp(true)
    setNotFound(false)
    try {
      const existing = await getPatientByEmail(email)
      if (existing) {
        onSelect(existing)
      } else {
        setNotFound(true)
        setStep('create')
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLookingUp(false)
    }
  }

  const toastId = 'create-patient'
  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => createPatient({ full_name: fullName.trim(), email }),
    onMutate: () => { toast.loading('Creando paciente…', { id: toastId }) },
    onSuccess: (patient) => {
      toast.success('Paciente creado', { id: toastId })
      onSelect(patient)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  if (step === 'email') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver
        </button>
        <div className="space-y-1.5">
          <Label htmlFor="patient-email">Email del paciente</Label>
          <div className="flex gap-2">
            <Input
              id="patient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSearch()}
              placeholder="email@ejemplo.com"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={handleEmailSearch}
              disabled={lookingUp || !email.trim()}
            >
              {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => { setStep('email'); setNotFound(false) }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Volver
      </button>
      {notFound && (
        <p className="text-xs text-muted-foreground">
          No encontramos ningún paciente con ese email.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="patient-name">Nombre completo</Label>
        <Input
          id="patient-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          autoFocus
        />
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => create()}
        disabled={creating || !fullName.trim()}
      >
        {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
        Crear paciente
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/NewPatientSubStep.tsx
git commit -m "feat: add NewPatientSubStep component (email lookup + create)"
```

---

## Task 6: PatientSelector Component

**Files:**
- Create: `src/pages/agenda/components/PatientSelector.tsx`

Search existing patients by name with a debounced input + dropdown results.

- [ ] **Step 1: Create the file**

```typescript
import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchPatientsByName, type Patient } from '../services/patients.service'

interface Props {
  selectedPatient: Patient | null
  onSelect: (patient: Patient) => void
  onNewPatient: () => void
}

export function PatientSelector({ selectedPatient, onSelect, onNewPatient }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchPatientsByName(value)
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (patient: Patient) => {
    onSelect(patient)
    setQuery('')
    setOpen(false)
  }

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant">
        <div>
          <p className="text-sm font-medium text-foreground">{selectedPatient.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{selectedPatient.email ?? '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null as unknown as Patient)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar paciente por nombre…"
          className="pl-8"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-outline-variant bg-surface-container shadow-lg overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
          )}
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex flex-col items-start px-3 py-2 text-sm hover:bg-surface-container-high transition-colors"
            >
              <span className="font-medium text-foreground">{p.full_name ?? '—'}</span>
              <span className="text-xs text-muted-foreground">{p.email ?? '—'}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onNewPatient}
        className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Paciente nuevo
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/PatientSelector.tsx
git commit -m "feat: add PatientSelector component with debounced search"
```

---

## Task 7: NewAppointmentDialog Component

**Files:**
- Create: `src/pages/agenda/components/NewAppointmentDialog.tsx`

Main wizard dialog. Composes PatientSelector and NewPatientSubStep. Form via react-hook-form + Zod.

- [ ] **Step 1: Create the file**

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
import { PatientSelector } from './PatientSelector'
import { NewPatientSubStep } from './NewPatientSubStep'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  startTime: z.string().min(1, 'Requerido'),
  endTime: z.string().min(1, 'Requerido'),
}).refine((d) => d.startTime < d.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endTime'],
})

type FormValues = z.infer<typeof schema>

interface Props {
  professionalId: string
  defaultDate?: Date
  trigger?: React.ReactNode
}

export function NewAppointmentDialog({ professionalId, defaultDate, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [patientError, setPatientError] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const defaultDateStr = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : ''

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: defaultDateStr, startTime: '', endTime: '' },
  })

  const handleClose = () => {
    setOpen(false)
    setSelectedPatient(null)
    setShowNewPatient(false)
    setPatientError(false)
    reset({ date: defaultDateStr, startTime: '', endTime: '' })
  }

  const toastId = 'create-appointment'

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const start_at = new Date(`${values.date}T${values.startTime}`).toISOString()
      const end_at = new Date(`${values.date}T${values.endTime}`).toISOString()
      return createAppointment({
        professional_id: professionalId,
        patient_id: selectedPatient!.patient_id,
        start_at,
        end_at,
        booked_by: user!.id,
      })
    },
    onMutate: () => { toast.loading('Creando turno…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Turno creado', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['appointments', professionalId] })
      handleClose()
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  const onSubmit = (values: FormValues) => {
    if (!selectedPatient) { setPatientError(true); return }
    setPatientError(false)
    mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <CalendarPlus />
            Nuevo turno
          </Button>
        )}
      </DialogTrigger>

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
          {/* Patient section */}
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            {showNewPatient ? (
              <NewPatientSubStep
                onSelect={(patient) => {
                  setSelectedPatient(patient)
                  setShowNewPatient(false)
                  setPatientError(false)
                }}
                onBack={() => setShowNewPatient(false)}
              />
            ) : (
              <PatientSelector
                selectedPatient={selectedPatient}
                onSelect={(p) => { setSelectedPatient(p); setPatientError(false) }}
                onNewPatient={() => setShowNewPatient(true)}
              />
            )}
            {patientError && (
              <p className="text-xs text-destructive">Seleccioná un paciente</p>
            )}
          </div>

          {/* Date/time section — hidden when new patient sub-step is open */}
          {!showNewPatient && (
            <>
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
                <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  Confirmar
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors. Note: `date-fns` may not be installed. If the import fails, replace with:
```typescript
// Replace format(defaultDate, 'yyyy-MM-dd') with:
const defaultDateStr = defaultDate
  ? defaultDate.toISOString().split('T')[0]
  : ''
// And remove the date-fns import entirely.
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/NewAppointmentDialog.tsx
git commit -m "feat: add NewAppointmentDialog wizard"
```

---

## Task 8: AppointmentList Component

**Files:**
- Create: `src/pages/agenda/components/AppointmentList.tsx`

Basic list of appointments for the professional.

- [ ] **Step 1: Create the file**

```typescript
import { useQuery } from '@tanstack/react-query'
import { Clock, User } from 'lucide-react'
import { getAppointmentsForProfessional } from '../services/appointments.service'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-destructive',
  COMPLETED: 'text-muted-foreground',
}

interface Props {
  professionalId: string
}

export function AppointmentList({ professionalId }: Props) {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', professionalId],
    queryFn: () => getAppointmentsForProfessional(professionalId),
    enabled: !!professionalId,
  })

  if (isLoading) {
    return <div className="text-xs text-muted-foreground px-1">Cargando turnos…</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hay turnos agendados
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => {
        const start = new Date(appt.start_at)
        const end = new Date(appt.end_at)
        const dateStr = start.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
        const startStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        const endStr = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

        return (
          <div
            key={appt.appointment_id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{appt.patient?.full_name ?? 'Paciente sin nombre'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {dateStr} · {startStr} – {endStr}
              </div>
            </div>
            <span className={`text-xs font-medium ${STATUS_COLORS[appt.status] ?? 'text-muted-foreground'}`}>
              {STATUS_LABELS[appt.status] ?? appt.status}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/AppointmentList.tsx
git commit -m "feat: add AppointmentList component"
```

---

## Task 9: Wire Up AgendaPage

**Files:**
- Modify: `src/pages/agenda/AgendaPage.tsx`

Add the "Nuevo turno" button and appointment list. Uses `useProfessionalId` to resolve the logged-in user's professional record.

- [ ] **Step 1: Replace AgendaPage content**

```typescript
import { AgendaToolbar } from './AgendaToolbar'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import { AppointmentList } from './components/AppointmentList'
import { useProfessionalId } from './hooks/useProfessionalId'

export function AgendaPage() {
  const { data: professionalId, isLoading } = useProfessionalId()

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

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/AgendaPage.tsx
git commit -m "feat: wire up agenda page with appointment wizard and list"
```

---

## Self-Review

- ✅ DB migration covers `patients` and `appointments` changes from spec
- ✅ Email-first patient lookup flow matches spec exactly
- ✅ `professionalId` always comes from props (Task 9 resolves it via hook, passes as prop to dialog)
- ✅ `booked_by` from auth context
- ✅ Toast loading pattern on all mutations
- ✅ No toasts for validation — inline errors via react-hook-form
- ✅ `date-fns` dependency risk noted with fallback in Task 7
- ⚠️ `appointment_sessions` is not created at booking time — intentional per spec's deferred decision
