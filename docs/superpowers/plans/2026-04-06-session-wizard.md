# Session Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the clinical session wizard — entry page (patient info + history) + Anamnesis Phase 1 (region, domain, 4 questions with auto-save) — triggered by double-clicking an appointment.

**Architecture:** Draft session created on double-click before navigating. All steps share the same `sessionId` in the URL (`/professional/sessions/:sessionId` and `/professional/sessions/:sessionId/anamnesis-fase1`). Every Phase 1 field change auto-saves to Supabase immediately via mutation (no submit button). The "Continuar" button only navigates.

**Tech Stack:** React 19, TypeScript, React Router v7, TanStack Query v5, Supabase JS v2, Radix UI (via unified `radix-ui` package), Sonner toasts, Tailwind CSS v4

---

## File Map

**New files:**
- `src/pages/sessions/types/session.types.ts`
- `src/pages/sessions/services/sessions.service.ts`
- `src/pages/sessions/services/anamnesis.service.ts`
- `src/components/ui/select.tsx`
- `src/components/ui/radio-group.tsx`
- `src/pages/sessions/components/WizardProgress.tsx`
- `src/pages/sessions/components/SaveIndicator.tsx`
- `src/pages/sessions/components/PatientCard.tsx`
- `src/pages/sessions/components/SessionHistory.tsx`
- `src/pages/sessions/components/AnamnesisPhase1Form.tsx`
- `src/pages/sessions/SessionPage.tsx`
- `src/pages/sessions/AnamnesisPhase1Page.tsx`

**Modified:**
- `src/App.tsx` — add 2 professional session routes
- `src/pages/agenda/components/AppointmentList.tsx` — add `onDoubleClick` prop
- `src/pages/agenda/AgendaPage.tsx` — handle double-click, create draft session, navigate

---

### Task 1: DB Migration — sessions table

**Files:** Supabase migration via MCP tool

The `sessions` table currently has `region_id`, `domain_id`, `objective_id` as NOT NULL and no `status` column. Draft sessions need nullable fields and a lifecycle status.

- [ ] **Step 1: Apply migration using `mcp__supabase__apply_migration`**

Migration name: `add_session_status_and_nullable_fields`

```sql
ALTER TABLE sessions
  ALTER COLUMN region_id DROP NOT NULL,
  ALTER COLUMN domain_id DROP NOT NULL,
  ALTER COLUMN objective_id DROP NOT NULL;

CREATE TYPE session_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE sessions ADD COLUMN status session_status NOT NULL DEFAULT 'DRAFT';
```

- [ ] **Step 2: Verify**

Run this SQL:
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sessions'
ORDER BY ordinal_position;
```

Expected: `region_id`, `domain_id`, `objective_id` show `YES` for `is_nullable`. `status` column appears with type `USER-DEFINED`.

---

### Task 2: Types

**Files:**
- Create: `src/pages/sessions/types/session.types.ts`

- [ ] **Step 1: Create file**

```typescript
// src/pages/sessions/types/session.types.ts

export type SessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'

export interface Session {
  session_id: string
  patient_id: string
  professional_id: string
  region_id: string | null
  domain_id: string | null
  objective_id: string | null
  organization_id: string
  status: SessionStatus
  created_at: string
}

export interface PatientInfo {
  patient_id: string
  user_id: string
  user: {
    full_name: string | null
    email: string | null
    identification_number: string | null
  } | null
}

export interface SessionHistoryItem {
  session_id: string
  created_at: string
  status: SessionStatus
  domain: { name: string } | null
  region: { name: string } | null
}

export interface Phase1Question {
  question_id: string
  question: string
  options: { label: string; value: string }[]
  order_index: number
}

export interface Domain {
  domain_id: string
  name: string
}

export interface Region {
  region_id: string
  name: string
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build (this file has no imports to break).

- [ ] **Step 3: Commit**

```bash
git add src/pages/sessions/types/session.types.ts
git commit -m "feat: add session wizard domain types"
```

---

### Task 3: sessions.service.ts

**Files:**
- Create: `src/pages/sessions/services/sessions.service.ts`

- [ ] **Step 1: Create file**

```typescript
// src/pages/sessions/services/sessions.service.ts
import { supabase } from '@/service'
import type { Session, PatientInfo, SessionHistoryItem } from '../types/session.types'

export async function createDraftSession(input: {
  patientId: string
  professionalId: string
  organizationId: string
}): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      patient_id: input.patientId,
      professional_id: input.professionalId,
      organization_id: input.organizationId,
    })
    .select('session_id, patient_id, professional_id, region_id, domain_id, objective_id, organization_id, status, created_at')
    .single()
  if (error) throw new Error(error.message)
  return data as Session
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, patient_id, professional_id, region_id, domain_id, objective_id, organization_id, status, created_at')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Session | null
}

export async function getPatient(patientId: string): Promise<PatientInfo | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id, user_id, user:users!patients_user_id_fkey(full_name, email, identification_number)')
    .eq('patient_id', patientId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as PatientInfo | null
}

export async function getSessionsByPatient(
  patientId: string,
  excludeSessionId: string
): Promise<SessionHistoryItem[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, created_at, status, domain:domains(name), region:regions(name)')
    .eq('patient_id', patientId)
    .neq('session_id', excludeSessionId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SessionHistoryItem[]
}

export async function updateSessionFields(
  sessionId: string,
  fields: { region_id?: string; domain_id?: string }
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(fields)
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/pages/sessions/services/sessions.service.ts
git commit -m "feat: add sessions service (createDraft, get, patient, history)"
```

---

### Task 4: anamnesis.service.ts

**Files:**
- Create: `src/pages/sessions/services/anamnesis.service.ts`

The `anamnesis_answers` table has: `answer_id`, `session_id`, `question_id`, `phase` (enum: PHASE1/PHASE2), `answer` (text), `organization_id`. The `phase` field uses the DB enum `ANAMNESIS_PHASE`.

- [ ] **Step 1: Create file**

```typescript
// src/pages/sessions/services/anamnesis.service.ts
import { supabase } from '@/service'
import type { Phase1Question, Domain, Region } from '../types/session.types'

export async function getPhase1Questions(): Promise<Phase1Question[]> {
  const { data, error } = await supabase
    .from('anamnesis_phase1_questions')
    .select('question_id, question, options, order_index')
    .order('order_index', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Phase1Question[]
}

export async function getDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('domain_id, name')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('region_id, name')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getExistingPhase1Answers(
  sessionId: string
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('anamnesis_answers')
    .select('question_id, answer')
    .eq('session_id', sessionId)
    .eq('phase', 'PHASE1')
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map(r => [r.question_id, r.answer]))
}

export async function upsertPhase1Answer(input: {
  sessionId: string
  questionId: string
  answer: string
  organizationId: string
}): Promise<void> {
  const { error } = await supabase
    .from('anamnesis_answers')
    .upsert(
      {
        session_id: input.sessionId,
        question_id: input.questionId,
        phase: 'PHASE1',
        answer: input.answer,
        organization_id: input.organizationId,
      },
      { onConflict: 'session_id,question_id' }
    )
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/pages/sessions/services/anamnesis.service.ts
git commit -m "feat: add anamnesis service (questions, domains, regions, upsert answer)"
```

---

### Task 5: Select and RadioGroup UI components

**Files:**
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/radio-group.tsx`

This project uses the unified `radix-ui` package — **not** individual `@radix-ui/react-*` packages. Follow the same import pattern as `src/components/ui/dialog.tsx`: `import { X as XPrimitive } from "radix-ui"`.

- [ ] **Step 1: Create `src/components/ui/select.tsx`**

```tsx
import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 min-w-32 overflow-hidden rounded-lg border border-outline-variant bg-popover text-popover-foreground shadow-md",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
```

- [ ] **Step 2: Create `src/components/ui/radio-group.tsx`**

```tsx
import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary",
        "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <CircleIcon className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/select.tsx src/components/ui/radio-group.tsx
git commit -m "feat: add Select and RadioGroup UI components"
```

---

### Task 6: WizardProgress component

**Files:**
- Create: `src/pages/sessions/components/WizardProgress.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/components/WizardProgress.tsx
import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['Entrada', 'Fase 1', 'Fase 2', 'Tests']

interface Props {
  currentStep: number // 0-indexed: 0=Entrada, 1=Fase1, 2=Fase2, 3=Tests
}

export function WizardProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center px-6 py-3 border-b border-outline-variant gap-1">
      {WIZARD_STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {i > 0 && (
            <div
              className={cn(
                'h-px w-6 mx-1',
                i <= currentStep ? 'bg-primary' : 'bg-outline-variant'
              )}
            />
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              i === currentStep
                ? 'text-primary'
                : i < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40'
            )}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                i === currentStep
                  ? 'bg-primary'
                  : i < currentStep
                    ? 'bg-muted-foreground'
                    : 'bg-outline-variant'
              )}
            />
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/components/WizardProgress.tsx
git commit -m "feat: add WizardProgress component"
```

---

### Task 7: SaveIndicator component

**Files:**
- Create: `src/pages/sessions/components/SaveIndicator.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/components/SaveIndicator.tsx
import { useEffect, useState } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
}

export function SaveIndicator({ status }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true)
    }
    if (status === 'saved') {
      const t = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(t)
    }
  }, [status])

  if (!visible) return null

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', {
        'text-muted-foreground': status === 'saving',
        'text-green-500': status === 'saved',
        'text-destructive': status === 'error',
      })}
    >
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved' && <Check className="h-3 w-3" />}
      {status === 'error' && <AlertCircle className="h-3 w-3" />}
      <span>
        {status === 'saving' && 'Guardando…'}
        {status === 'saved' && 'Guardado'}
        {status === 'error' && 'Error al guardar'}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/components/SaveIndicator.tsx
git commit -m "feat: add SaveIndicator component"
```

---

### Task 8: PatientCard component

**Files:**
- Create: `src/pages/sessions/components/PatientCard.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/components/PatientCard.tsx
import { User, Mail, CreditCard } from 'lucide-react'
import type { PatientInfo } from '../types/session.types'

interface Props {
  patient: PatientInfo
}

export function PatientCard({ patient }: Props) {
  const { user } = patient
  return (
    <div className="rounded-xl bg-surface-container border border-outline-variant p-4 space-y-2">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">
          {user?.full_name ?? 'Sin nombre'}
        </span>
      </div>
      {user?.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span>{user.email}</span>
        </div>
      )}
      {user?.identification_number && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          <span>DNI {user.identification_number}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/components/PatientCard.tsx
git commit -m "feat: add PatientCard component"
```

---

### Task 9: SessionHistory component

**Files:**
- Create: `src/pages/sessions/components/SessionHistory.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/components/SessionHistory.tsx
import { Calendar, Activity } from 'lucide-react'
import type { SessionHistoryItem } from '../types/session.types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
}

interface Props {
  sessions: SessionHistoryItem[]
}

export function SessionHistory({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Primera sesión con este paciente
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.session_id}
          className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {s.domain?.name ?? '—'} · {s.region?.name ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {new Date(s.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {STATUS_LABELS[s.status] ?? s.status}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/components/SessionHistory.tsx
git commit -m "feat: add SessionHistory component"
```

---

### Task 10: AnamnesisPhase1Form component

**Files:**
- Create: `src/pages/sessions/components/AnamnesisPhase1Form.tsx`

This component holds all auto-save logic. Each `onChange` fires a mutation immediately. No submit button — "Continuar" only navigates.

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/components/AnamnesisPhase1Form.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateSessionFields } from '../services/sessions.service'
import { upsertPhase1Answer } from '../services/anamnesis.service'
import { SaveIndicator, type SaveStatus } from './SaveIndicator'
import type { Phase1Question, Domain, Region } from '../types/session.types'

interface Props {
  sessionId: string
  organizationId: string
  questions: Phase1Question[]
  domains: Domain[]
  regions: Region[]
  initialRegionId: string | null
  initialDomainId: string | null
  initialAnswers: Record<string, string>
}

export function AnamnesisPhase1Form({
  sessionId,
  organizationId,
  questions,
  domains,
  regions,
  initialRegionId,
  initialDomainId,
  initialAnswers,
}: Props) {
  const navigate = useNavigate()
  const [regionId, setRegionId] = useState<string>(initialRegionId ?? '')
  const [domainId, setDomainId] = useState<string>(initialDomainId ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const sessionMutation = useMutation({
    mutationFn: (fields: { region_id?: string; domain_id?: string }) =>
      updateSessionFields(sessionId, fields),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('error'),
  })

  const answerMutation = useMutation({
    mutationFn: (vars: { questionId: string; answer: string }) =>
      upsertPhase1Answer({
        sessionId,
        questionId: vars.questionId,
        answer: vars.answer,
        organizationId,
      }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('error'),
  })

  function handleRegionChange(value: string) {
    setRegionId(value)
    sessionMutation.mutate({ region_id: value })
  }

  function handleDomainChange(value: string) {
    setDomainId(value)
    sessionMutation.mutate({ domain_id: value })
  }

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    answerMutation.mutate({ questionId, answer: value })
  }

  const allAnswered =
    regionId !== '' &&
    domainId !== '' &&
    questions.every((q) => answers[q.question_id] !== undefined)

  return (
    <div className="space-y-8">
      {/* Region + Domain selectors */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 flex-1 max-w-sm">
          <div className="space-y-1.5">
            <Label>Región corporal</Label>
            <Select value={regionId} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.region_id} value={r.region_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Dominio</Label>
            <Select value={domainId} onValueChange={handleDomainChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.domain_id} value={d.domain_id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SaveIndicator status={saveStatus} />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.question_id} className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {i + 1}. {q.question}
            </p>
            <RadioGroup
              value={answers[q.question_id] ?? ''}
              onValueChange={(value) => handleAnswerChange(q.question_id, value)}
              className="space-y-1.5"
            >
              {q.options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${q.question_id}-${opt.value}`}
                  />
                  <Label
                    htmlFor={`${q.question_id}-${opt.value}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
        <Button
          variant="outline"
          onClick={() => navigate(`/professional/sessions/${sessionId}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          disabled={!allAnswered}
          onClick={() => navigate(`/professional/sessions/${sessionId}`)}
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

Note: "Continuar" navigates back to the session entry for now since Fase 2 is out of scope. Replace the `navigate` target when Fase 2 is built.

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/components/AnamnesisPhase1Form.tsx
git commit -m "feat: add AnamnesisPhase1Form with auto-save"
```

---

### Task 11: SessionPage

**Files:**
- Create: `src/pages/sessions/SessionPage.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/SessionPage.tsx
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession, getPatient, getSessionsByPatient } from './services/sessions.service'
import { PatientCard } from './components/PatientCard'
import { SessionHistory } from './components/SessionHistory'
import { WizardProgress } from './components/WizardProgress'
import { useProfessionalId } from '../agenda/hooks/useProfessionalId'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { data: professionalId } = useProfessionalId()

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (loadingSession) return
    if (session === null) {
      navigate('/professional/agenda', { replace: true })
      return
    }
    if (professionalId && session && session.professional_id !== professionalId) {
      navigate('/professional/agenda', { replace: true })
    }
  }, [session, loadingSession, professionalId, navigate])

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', session?.patient_id],
    queryFn: () => getPatient(session!.patient_id),
    enabled: !!session?.patient_id,
  })

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['session-history', session?.patient_id, sessionId],
    queryFn: () => getSessionsByPatient(session!.patient_id, sessionId!),
    enabled: !!session?.patient_id,
  })

  if (loadingSession || loadingPatient) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
  }

  if (!session || !patient) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WizardProgress currentStep={0} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/professional/agenda')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Sesión clínica
          </h2>
        </div>

        <PatientCard patient={patient} />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Sesiones anteriores</h3>
          {loadingHistory ? (
            <div className="text-xs text-muted-foreground">Cargando historial…</div>
          ) : (
            <SessionHistory sessions={history} />
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() =>
              navigate(`/professional/sessions/${sessionId}/anamnesis-fase1`)
            }
          >
            Iniciar evaluación
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sessions/SessionPage.tsx
git commit -m "feat: add SessionPage (entry step of wizard)"
```

---

### Task 12: AnamnesisPhase1Page

**Files:**
- Create: `src/pages/sessions/AnamnesisPhase1Page.tsx`

- [ ] **Step 1: Create file**

```tsx
// src/pages/sessions/AnamnesisPhase1Page.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from './services/sessions.service'
import {
  getPhase1Questions,
  getDomains,
  getRegions,
  getExistingPhase1Answers,
} from './services/anamnesis.service'
import { AnamnesisPhase1Form } from './components/AnamnesisPhase1Form'
import { WizardProgress } from './components/WizardProgress'

export function AnamnesisPhase1Page() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  })

  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['phase1-questions'],
    queryFn: getPhase1Questions,
    staleTime: Infinity,
  })

  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: ['domains'],
    queryFn: getDomains,
    staleTime: Infinity,
  })

  const { data: regions = [], isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
    staleTime: Infinity,
  })

  const { data: existingAnswers = {}, isLoading: loadingAnswers } = useQuery({
    queryKey: ['phase1-answers', sessionId],
    queryFn: () => getExistingPhase1Answers(sessionId!),
    enabled: !!sessionId,
  })

  const isLoading =
    loadingQuestions || loadingDomains || loadingRegions || loadingAnswers || !session

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WizardProgress currentStep={1} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(`/professional/sessions/${sessionId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Anamnesis — Fase 1
          </h2>
        </div>

        <AnamnesisPhase1Form
          sessionId={sessionId!}
          organizationId={profile?.organization_id ?? ''}
          questions={questions}
          domains={domains}
          regions={regions}
          initialRegionId={session.region_id}
          initialDomainId={session.domain_id}
          initialAnswers={existingAnswers}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build — all session pages and components compile.

- [ ] **Step 3: Commit**

```bash
git add src/pages/sessions/AnamnesisPhase1Page.tsx
git commit -m "feat: add AnamnesisPhase1Page"
```

---

### Task 13: App.tsx — add session routes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports** (alongside existing page imports)

```typescript
import { SessionPage } from './pages/sessions/SessionPage'
import { AnamnesisPhase1Page } from './pages/sessions/AnamnesisPhase1Page'
```

- [ ] **Step 2: Add routes**

Inside the `ProfesionalLayout` block for PROFESSIONAL/ADMIN/SUPERADMIN, after the `/professional/patients` route:

```tsx
<Route path="/professional/sessions/:sessionId" element={<SessionPage />} />
<Route path="/professional/sessions/:sessionId/anamnesis-fase1" element={<AnamnesisPhase1Page />} />
```

The full block becomes:

```tsx
<Route element={<RoleAuth allowedRoles={['PROFESSIONAL', 'ADMIN', 'SUPERADMIN']} redirectTo="/patient/dashboard" />}>
  <Route element={<ProfesionalLayout />}>
    <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
    <Route path="/professional/agenda" element={<AgendaPage />} />
    <Route path="/professional/patients" element={<PatientsPage />} />
    <Route path="/professional/sessions/:sessionId" element={<SessionPage />} />
    <Route path="/professional/sessions/:sessionId/anamnesis-fase1" element={<AnamnesisPhase1Page />} />
  </Route>
</Route>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register session wizard routes in App.tsx"
```

---

### Task 14: Wire AppointmentList + AgendaPage

**Files:**
- Modify: `src/pages/agenda/components/AppointmentList.tsx`
- Modify: `src/pages/agenda/AgendaPage.tsx`

- [ ] **Step 1: Update `AppointmentList.tsx`**

Add `onDoubleClick` to the Props interface and wire it to each row:

```tsx
import { useQuery } from '@tanstack/react-query'
import { Clock, User } from 'lucide-react'
import { getAppointmentsForProfessional, type Appointment } from '../services/appointments.service'

const STATUS_LABELS: Record<Appointment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<Appointment['status'], string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-destructive',
  COMPLETED: 'text-muted-foreground',
}

interface Props {
  professionalId: string
  onDoubleClick?: (appointment: Appointment) => void
}

export function AppointmentList({ professionalId, onDoubleClick }: Props) {
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
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant cursor-pointer select-none"
            onDoubleClick={() => onDoubleClick?.(appt)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{appt.patient?.user.full_name ?? 'Paciente sin nombre'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {dateStr} · {startStr} – {endStr}
              </div>
            </div>
            <span className={`text-xs font-medium ${STATUS_COLORS[appt.status]}`}>
              {STATUS_LABELS[appt.status]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update `AgendaPage.tsx`**

Add the double-click handler and session creation mutation. Full file:

```tsx
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AgendaToolbar } from './AgendaToolbar'
import { AgendaDayNav } from './components/AgendaDayNav'
import { AgendaDayGrid } from './components/AgendaDayGrid'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import { AppointmentList } from './components/AppointmentList'
import { useProfessionalId } from './hooks/useProfessionalId'
import { useAuth } from '@/contexts/AuthContext'
import { createDraftSession } from '../sessions/services/sessions.service'
import type { Appointment } from './services/appointments.service'

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
  const navigate = useNavigate()
  const { profile } = useAuth()

  const createSessionMutation = useMutation({
    mutationFn: (appointment: Appointment) =>
      createDraftSession({
        patientId: appointment.patient_id!,
        professionalId: professionalId!,
        organizationId: profile?.organization_id ?? '',
      }),
    onMutate: () => toast.loading('Abriendo sesión…', { id: 'create-session' }),
    onSuccess: (session) => {
      toast.success('Sesión iniciada', { id: 'create-session' })
      navigate(`/professional/sessions/${session.session_id}`)
    },
    onError: (err: Error) => toast.error(err.message, { id: 'create-session' }),
  })

  function handleAppointmentDoubleClick(appointment: Appointment) {
    if (!professionalId || !profile?.organization_id || !appointment.patient_id) return
    createSessionMutation.mutate(appointment)
  }

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
          <AppointmentList
            professionalId={professionalId}
            onDoubleClick={handleAppointmentDoubleClick}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/agenda/components/AppointmentList.tsx src/pages/agenda/AgendaPage.tsx
git commit -m "feat: wire double-click on appointment to create draft session and navigate"
```

---

## Manual Smoke Test

After all tasks are complete:

1. Log in as a professional
2. Go to `/professional/agenda`
3. Double-click any appointment that has a `patient_id`
4. Verify: toast "Abriendo sesión…" → "Sesión iniciada" → navigates to `/professional/sessions/:id`
5. Verify: patient card shows name, email, DNI
6. Verify: session history shows "Primera sesión con este paciente" (or past sessions)
7. Click "Iniciar evaluación" → navigates to `/professional/sessions/:id/anamnesis-fase1`
8. Verify: WizardProgress shows step 2 active
9. Select a region → verify "Guardando…" → "Guardado" in top-right
10. Select a domain → same indicator
11. Answer all 4 questions → "Continuar" button becomes enabled
12. Click "← Anterior" → goes back to entry page → click "Iniciar evaluación" again
13. Verify: region, domain, and answers are pre-filled from DB
