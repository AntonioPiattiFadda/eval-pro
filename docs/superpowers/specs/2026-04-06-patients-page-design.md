# Patients Page — Design Spec

**Date:** 2026-04-06
**Scope:** `/professional/patients` — paginated server-side patient search with TanStack Query + TanStack Table, and a register-new-patient dialog.

---

## 1. Overview

The patients page lets professionals search for patients in their organization. The initial state shows an empty-state prompt — no table, no query. Once the user types a search term, results appear in a paginated table (10 per page, server-side). Clicking a row navigates to the patient detail page. A "Nuevo paciente" button opens a dialog to register a new patient.

---

## 2. Database Migration

Modify `search_patients` RPC to support optional pagination parameters:

```sql
CREATE OR REPLACE FUNCTION public.search_patients(
  p_org_id uuid,
  p_query text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
```

The existing call from `PatientStep` (agenda wizard) passes no limit/offset — defaults keep it backward compatible. The hardcoded `LIMIT 10` is replaced with `LIMIT p_limit OFFSET p_offset`.

---

## 3. File Structure

```
src/components/
  RegisterPatientForm.tsx      # Extracted from PatientStep: email/name/DNI form + invite mutation
  RegisterPatientDialog.tsx    # Dialog wrapper around RegisterPatientForm

src/service/
  patients.ts                  # invitePatient() moved here (shared across pages)

pages/patients/
  components/
    PatientsTable.tsx          # TanStack Table: columns, rows, pagination controls
  hooks/
    usePatientsSearch.ts       # TanStack Query + pageIndex state
  services/
    patients.service.ts        # searchPatientsPaginated()
  PatientsPage.tsx             # Page entry: layout, search bar, empty state, table

pages/agenda/components/
  PatientStep.tsx              # Simplified: delegates registration form to src/components
  (patients.service.ts kept for searchPatients autocomplete — agenda-only)
```

---

## 4. Pagination Strategy (Option A — prev/next, no total count)

- Request `pageSize + 1` rows (i.e. `p_limit = 11`) per query.
- If 11 rows return → `hasNextPage = true`, display first 10.
- If ≤ 10 rows return → last page, disable "Siguiente".
- `pageIndex` resets to 0 on every new search term.
- TanStack Query key: `['patients-search', query, pageIndex]` — each page is independently cached; navigating back is instant.

---

## 5. Service Layer

**`pages/patients/services/patients.service.ts`**

```ts
searchPatientsPaginated(query: string, organizationId: string, page: number): Promise<Patient[]>
// calls search_patients RPC with p_limit=11, p_offset=page*10
// returns raw array (caller slices to 10 and checks hasNextPage)
```

**`src/service/patients.ts`** (moved from agenda)

```ts
invitePatient(input): Promise<Patient>
// unchanged — same Edge Function call
```

---

## 6. Hook — `usePatientsSearch`

```ts
const { data, isFetching, pageIndex, setPageIndex, hasNextPage } = usePatientsSearch(query, organizationId)
```

- Wraps `useQuery` with key `['patients-search', query, pageIndex]`.
- `enabled: query.trim().length > 0` — no query fired on empty string.
- Debounce: 400ms via local state before updating the query key.
- `hasNextPage`: derived from `data.length > 10`.
- `setPageIndex(0)` called automatically when `query` changes (via `useEffect`).

---

## 7. Table — `PatientsTable`

TanStack Table with `manualPagination: true`.

| Column | Source | Notes |
|---|---|---|
| Nombre | `user.full_name` | Fallback `—` |
| Email | `user.email` | Fallback `—` |
| DNI | `user.identification_number` | Fallback `—` |
| Paciente desde | `created_at` | Formatted as `DD MMM YYYY` |

- Row click → `navigate('/professional/patients/${row.original.patient_id}')`.
- While fetching next page, table shows a subtle loading state (opacity or skeleton rows) but doesn't unmount.
- Pagination controls: "← Anterior" / "Siguiente →" buttons. Anterior disabled on page 0. Siguiente disabled when `!hasNextPage`. Page indicator: "Página N".

---

## 8. Empty States

| Condition | Display |
|---|---|
| No search yet (`query === ''`) | Centered card: search icon + "Buscá un paciente por nombre, email o DNI" |
| Searching (first load) | Skeleton rows in table area |
| No results | Inline message: "No encontramos pacientes con esa búsqueda" + "Registrar nuevo" button |
| Error | Inline error message with retry |

---

## 9. Register Patient

**`RegisterPatientForm`** — extracted from `PatientStep.tsx`:
- Props: `organizationId`, `onSuccess(patient: Patient)`, `onCancel()`
- Contains: email / full_name / identification_number inputs + "Registrar paciente" button
- Calls `invitePatient` from `src/service/patients.ts`
- Shows loading/success/error toasts per CLAUDE.md convention

**`RegisterPatientDialog`** — wraps `RegisterPatientForm` in a `<Dialog>`:
- Trigger: "Nuevo paciente" button in page header
- `onSuccess`: closes dialog + `queryClient.invalidateQueries(['patients-search'])`

**`PatientStep`** refactor:
- The `state === 'registering'` block is replaced with `<RegisterPatientForm>` from `src/components`
- Interface and behavior unchanged from the user's perspective

---

## 10. Patient Detail Page (placeholder)

Route: `/professional/patients/:patientId`
- Added to `App.tsx` under the Professional routes
- Page: `pages/patient-detail/PatientDetailPage.tsx` (placeholder "En construcción")
- Will eventually contain: appointments, training plans, evaluations

---

## 11. What's Out of Scope

- Sorting columns
- Filtering by specialty or date range
- Bulk actions
- Patient detail page content (only placeholder)
- Edit/delete patient
