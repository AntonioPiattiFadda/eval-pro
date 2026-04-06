# Patients Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/professional/patients` — a server-side paginated patient search page with TanStack Query + TanStack Table, register-new-patient dialog, and a patient detail placeholder page.

**Architecture:** Search is driven by a modified `search_patients` RPC (adds optional `p_limit`/`p_offset` params). A custom hook manages debounce + TanStack Query pagination. The registration form is extracted to `src/components/` so it's shared between the agenda wizard and this page.

**Tech Stack:** React 19, TanStack Query v5, `@tanstack/react-table` (to install), Supabase RPC, date-fns, react-router-dom v7, shadcn/ui (Dialog, Input, Button, Skeleton, Label).

**Note:** No test runner is configured — skip TDD steps. Lint with `npm run lint` and build-check with `npm run build` after each task group.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/types/patients.ts` | Shared `Patient` interface |
| Create | `src/service/patients.ts` | `invitePatient()` (moved from agenda service) |
| Modify | `src/pages/agenda/services/patients.service.ts` | Remove `invitePatient` + `Patient` type (now imported from shared) |
| Create | `src/components/RegisterPatientForm.tsx` | email/name/DNI form + invite mutation |
| Create | `src/components/RegisterPatientDialog.tsx` | Dialog wrapper for RegisterPatientForm |
| Modify | `src/pages/agenda/components/PatientStep.tsx` | Replace inline registering form with RegisterPatientForm |
| Create | `src/pages/patients/services/patients.service.ts` | `searchPatientsPaginated()` |
| Create | `src/pages/patients/hooks/usePatientsSearch.ts` | debounce + TanStack Query + pagination state |
| Create | `src/pages/patients/components/PatientsTable.tsx` | TanStack Table + pagination controls |
| Modify | `src/pages/patients/PatientsPage.tsx` | Full page: search bar, empty state, table, dialog |
| Create | `src/pages/patient-detail/PatientDetailPage.tsx` | Placeholder for patient detail |
| Modify | `src/App.tsx` | Add `/professional/patients/:patientId` route |

---

## Task 1: Install @tanstack/react-table

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
npm install @tanstack/react-table
```

Expected output: package added, `package-lock.json` updated, no errors.

- [ ] **Step 2: Verify it resolves**

```bash
npm run build 2>&1 | head -5
```

Expected: build succeeds (or fails only on unrelated pre-existing issues, not on the new import).

---

## Task 2: DB Migration — add pagination params to search_patients

**Files:**
- Modify: Supabase function `search_patients` via MCP migration tool

- [ ] **Step 1: Apply migration**

Use `mcp__supabase__apply_migration` with name `add_pagination_to_search_patients` and SQL:

```sql
CREATE OR REPLACE FUNCTION public.search_patients(
  p_org_id uuid,
  p_query text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  patient_id uuid,
  user_id uuid,
  organization_id uuid,
  created_at timestamp with time zone,
  full_name text,
  email text,
  identification_number text
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
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
      u.full_name               ILIKE '%' || p_query || '%'
      OR u.email                ILIKE '%' || p_query || '%'
      OR u.identification_number ILIKE '%' || p_query || '%'
    )
  ORDER BY u.full_name
  LIMIT p_limit OFFSET p_offset;
$function$
```

- [ ] **Step 2: Verify backward compatibility**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT * FROM search_patients('00000000-0000-0000-0000-000000000000'::uuid, 'test');
```

Expected: returns 0 rows (org doesn't exist), no error — confirms the function accepts 2 args with defaults.

---

## Task 3: Shared Patient type + move invitePatient

**Files:**
- Create: `src/types/patients.ts`
- Create: `src/service/patients.ts`
- Modify: `src/pages/agenda/services/patients.service.ts`

- [ ] **Step 1: Create shared Patient type**

Create `src/types/patients.ts`:

```typescript
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

- [ ] **Step 2: Create src/service/patients.ts with invitePatient**

Create `src/service/patients.ts`:

```typescript
import { supabase } from '@/service'
import type { Patient } from '@/types/patients'

export async function invitePatient(input: {
  email: string
  full_name: string
  identification_number?: string
  organization_id: string
}): Promise<Patient> {
  const { data, error } = await supabase.functions.invoke('invite-patient', {
    body: {
      ...input,
      redirectTo: `${window.location.origin}/reset-password`,
    },
  })
  if (error) {
    const body = await (error as any).context?.json().catch(() => null)
    if (body?.error) throw new Error(body.error)
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data as Patient
}
```

- [ ] **Step 3: Update agenda patients.service.ts to use shared types**

Replace the full content of `src/pages/agenda/services/patients.service.ts` with:

```typescript
import { supabase } from '@/service'
import type { Patient } from '@/types/patients'

export type { Patient }
export { invitePatient } from '@/service/patients'

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
```

- [ ] **Step 4: Lint check**

```bash
npm run lint 2>&1 | grep -E "error|warning" | head -20
```

Expected: no new errors.

---

## Task 4: Extract RegisterPatientForm to src/components/

**Files:**
- Create: `src/components/RegisterPatientForm.tsx`

The form is extracted from the `state === 'registering'` block in `PatientStep.tsx`. It owns the input state and the invite mutation.

- [ ] **Step 1: Create RegisterPatientForm**

Create `src/components/RegisterPatientForm.tsx`:

```typescript
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { invitePatient } from '@/service/patients'
import type { Patient } from '@/types/patients'

interface Props {
  organizationId: string
  onSuccess: (patient: Patient) => void
  onCancel: () => void
  /** Label for the cancel action. Defaults to "Volver a buscar" */
  cancelLabel?: string
}

export function RegisterPatientForm({
  organizationId,
  onSuccess,
  onCancel,
  cancelLabel = 'Volver a buscar',
}: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [identificationNumber, setIdentificationNumber] = useState('')

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
      onSuccess(patient)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {cancelLabel}
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
```

---

## Task 5: Create RegisterPatientDialog

**Files:**
- Create: `src/components/RegisterPatientDialog.tsx`

- [ ] **Step 1: Create RegisterPatientDialog**

Create `src/components/RegisterPatientDialog.tsx`:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RegisterPatientForm } from '@/components/RegisterPatientForm'
import type { Patient } from '@/types/patients'

interface Props {
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (patient: Patient) => void
}

export function RegisterPatientDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <RegisterPatientForm
          organizationId={organizationId}
          onSuccess={(patient) => {
            onOpenChange(false)
            onSuccess(patient)
          }}
          onCancel={() => onOpenChange(false)}
          cancelLabel="Cancelar"
        />
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Lint check**

```bash
npm run lint 2>&1 | grep -E "error" | head -20
```

Expected: no errors.

---

## Task 6: Refactor PatientStep to use RegisterPatientForm

**Files:**
- Modify: `src/pages/agenda/components/PatientStep.tsx`

- [ ] **Step 1: Replace registering state block in PatientStep**

Replace the full content of `src/pages/agenda/components/PatientStep.tsx` with:

```typescript
import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RegisterPatientForm } from '@/components/RegisterPatientForm'
import { searchPatients } from '../services/patients.service'
import type { Patient } from '@/types/patients'

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

  const handleBackToIdle = () => {
    setQuery('')
    setResults([])
    setState('idle')
  }

  // Selected state
  if (selectedPatient) {
    const { full_name, email, identification_number } = selectedPatient.user
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant">
        <div>
          <p className="text-sm font-medium text-foreground">{full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {email ?? '—'}
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

  // Registering state — uses shared form
  if (state === 'registering') {
    return (
      <RegisterPatientForm
        organizationId={organizationId}
        onSuccess={(patient) => {
          setState('idle')
          setQuery('')
          onSelect(patient)
        }}
        onCancel={handleBackToIdle}
      />
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
              onClick={() => setState('registering')}
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

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds. The agenda wizard should work exactly as before.

---

## Task 7: Create paginated patients service

**Files:**
- Create: `src/pages/patients/services/patients.service.ts`

- [ ] **Step 1: Create the service**

Create `src/pages/patients/services/patients.service.ts`:

```typescript
import { supabase } from '@/service'
import type { Patient } from '@/types/patients'

const PAGE_SIZE = 10

export { PAGE_SIZE }

export async function searchPatientsPaginated(
  query: string,
  organizationId: string,
  page: number
): Promise<Patient[]> {
  const { data, error } = await supabase.rpc('search_patients', {
    p_org_id: organizationId,
    p_query: query.trim(),
    p_limit: PAGE_SIZE + 1,
    p_offset: page * PAGE_SIZE,
  })
  if (error) throw error
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
```

---

## Task 8: Create usePatientsSearch hook

**Files:**
- Create: `src/pages/patients/hooks/usePatientsSearch.ts`

- [ ] **Step 1: Create the hook**

Create `src/pages/patients/hooks/usePatientsSearch.ts`:

```typescript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPatientsPaginated, PAGE_SIZE } from '../services/patients.service'

export function usePatientsSearch(query: string, organizationId: string) {
  const [pageIndex, setPageIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce the query 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  // Reset to page 0 whenever the debounced query changes
  useEffect(() => {
    setPageIndex(0)
  }, [debouncedQuery])

  const { data: rawData = [], isFetching, isError, error } = useQuery({
    queryKey: ['patients-search', debouncedQuery, pageIndex, organizationId],
    queryFn: () => searchPatientsPaginated(debouncedQuery, organizationId, pageIndex),
    enabled: debouncedQuery.trim().length > 0 && !!organizationId,
    staleTime: 30_000,
  })

  const hasNextPage = rawData.length > PAGE_SIZE
  const data = rawData.slice(0, PAGE_SIZE)

  return {
    data,
    isFetching,
    isError,
    error,
    pageIndex,
    hasNextPage,
    hasSearch: debouncedQuery.trim().length > 0,
    goToNextPage: () => setPageIndex((p) => p + 1),
    goToPrevPage: () => setPageIndex((p) => p - 1),
  }
}
```

---

## Task 9: Create PatientsTable component

**Files:**
- Create: `src/pages/patients/components/PatientsTable.tsx`

- [ ] **Step 1: Create the table**

Create `src/pages/patients/components/PatientsTable.tsx`:

```typescript
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Patient } from '@/types/patients'

const columnHelper = createColumnHelper<Patient>()

const columns = [
  columnHelper.accessor((row) => row.user.full_name, {
    id: 'full_name',
    header: 'Nombre',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor((row) => row.user.email, {
    id: 'email',
    header: 'Email',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.accessor((row) => row.user.identification_number, {
    id: 'identification_number',
    header: 'DNI',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor('created_at', {
    header: 'Paciente desde',
    cell: (info) =>
      format(new Date(info.getValue()), "d 'de' MMM yyyy", { locale: es }),
  }),
]

interface Props {
  data: Patient[]
  isFetching: boolean
  pageIndex: number
  hasNextPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

export function PatientsTable({
  data,
  isFetching,
  pageIndex,
  hasNextPage,
  onNextPage,
  onPrevPage,
}: Props) {
  const navigate = useNavigate()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
  })

  if (isFetching) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No encontramos pacientes con esa búsqueda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-outline-variant bg-surface-container-high"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() =>
                  navigate(`/professional/patients/${row.original.patient_id}`)
                }
                className="border-b border-outline-variant last:border-0 hover:bg-surface-container-high cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">Página {pageIndex + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={pageIndex === 0 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage || isFetching}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 10: Build PatientsPage

**Files:**
- Modify: `src/pages/patients/PatientsPage.tsx`

- [ ] **Step 1: Replace the placeholder with the full page**

Replace the full content of `src/pages/patients/PatientsPage.tsx` with:

```typescript
import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RegisterPatientDialog } from '@/components/RegisterPatientDialog'
import { useAuth } from '@/contexts/AuthContext'
import { PatientsTable } from './components/PatientsTable'
import { usePatientsSearch } from './hooks/usePatientsSearch'

export function PatientsPage() {
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const organizationId = profile?.organization_id ?? ''

  const {
    data,
    isFetching,
    pageIndex,
    hasNextPage,
    hasSearch,
    goToNextPage,
    goToPrevPage,
  } = usePatientsSearch(query, organizationId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-on-surface">Pacientes</h1>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o DNI…"
          className="pl-10"
        />
      </div>

      {/* Content */}
      {!hasSearch ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="rounded-full bg-surface-container-high p-5">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-on-surface">Buscá un paciente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escribí el nombre, email o DNI para comenzar
            </p>
          </div>
        </div>
      ) : (
        <PatientsTable
          data={data}
          isFetching={isFetching}
          pageIndex={pageIndex}
          hasNextPage={hasNextPage}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
        />
      )}

      {/* Register dialog */}
      <RegisterPatientDialog
        organizationId={organizationId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patients-search'] })
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -15
```

Expected: build succeeds with no TypeScript errors.

---

## Task 11: Patient detail placeholder + route

**Files:**
- Create: `src/pages/patient-detail/PatientDetailPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create placeholder page**

Create `src/pages/patient-detail/PatientDetailPage.tsx`:

```typescript
import { useParams } from 'react-router-dom'

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Paciente</h2>
        <p className="font-mono text-xs text-muted-foreground">{patientId}</p>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

In `src/App.tsx`, add the import after the existing patient-related imports:

```typescript
import { PatientDetailPage } from './pages/patient-detail/PatientDetailPage'
```

Inside the `Professional & Admin` route group (after the `/professional/patients` route):

```tsx
<Route path="/professional/patients/:patientId" element={<PatientDetailPage />} />
```

The full Professional & Admin block becomes:

```tsx
{/* Professional & Admin */}
<Route element={<RoleAuth allowedRoles={['PROFESSIONAL', 'ADMIN', 'SUPERADMIN']} redirectTo="/patient/dashboard" />}>
  <Route element={<ProfesionalLayout />}>
    <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
    <Route path="/professional/agenda" element={<AgendaPage />} />
    <Route path="/professional/patients" element={<PatientsPage />} />
    <Route path="/professional/patients/:patientId" element={<PatientDetailPage />} />
  </Route>
</Route>
```

- [ ] **Step 3: Final build + lint check**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build, no TypeScript errors.

```bash
npm run lint 2>&1 | grep "error" | head -20
```

Expected: no errors.
