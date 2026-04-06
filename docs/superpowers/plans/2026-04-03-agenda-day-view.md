# Agenda Day View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secondary navigation header and placeholder time-slot grid to the agenda day view, with a two-panel date picker (monthly calendar + month grid).

**Architecture:** Four files: `AgendaDayGrid` (placeholder time column), `AgendaDatePicker` (two-panel Popover), `AgendaDayNav` (second header bar), and a modification to `AgendaPage` to conditionally render the day view. Selected date lives in URL search param `?date=YYYY-MM-DD`. No test runner exists — verification is via `npm run build`.

**Tech Stack:** React 19, TypeScript, React Router v7 (`useSearchParams`), shadcn Calendar + Popover (installs react-day-picker v9), lucide-react, Tailwind CSS v4 custom tokens.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Install | shadcn Calendar + Popover | Adds `src/components/ui/calendar.tsx` + `src/components/ui/popover.tsx` |
| Create | `src/pages/agenda/components/AgendaDayGrid.tsx` | Placeholder time-slot column (8–20h) |
| Create | `src/pages/agenda/components/AgendaDatePicker.tsx` | Two-panel date picker inside a Popover |
| Create | `src/pages/agenda/components/AgendaDayNav.tsx` | Secondary header: Hoy, prev/next, date trigger |
| Modify | `src/pages/agenda/AgendaPage.tsx` | Conditional render day view vs list view |

---

## Task 1: Install shadcn Calendar and Popover

**Files:**
- Create: `src/components/ui/calendar.tsx`
- Create: `src/components/ui/popover.tsx`

- [ ] **Step 1: Run shadcn add**

```bash
npx shadcn@latest add calendar popover --yes
```

Expected: two new files created, `react-day-picker` added to `package.json`.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/calendar.tsx src/components/ui/popover.tsx package.json package-lock.json
git commit -m "chore: add shadcn Calendar and Popover components"
```

---

## Task 2: Create AgendaDayGrid

**Files:**
- Create: `src/pages/agenda/components/AgendaDayGrid.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8–20

interface Props {
  date: Date
}

export function AgendaDayGrid({ date }: Props) {
  const isToday = new Date().toDateString() === date.toDateString()
  const dayNumber = date.getDate()
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day column header */}
      <div className="border-b border-outline-variant flex items-center gap-3 px-4 py-2 shrink-0 bg-surface">
        <div
          className={cn(
            'flex items-center justify-center size-9 rounded-full text-lg font-semibold',
            isToday
              ? 'bg-primary text-primary-foreground'
              : 'text-on-surface'
          )}
        >
          {dayNumber}
        </div>
        <span className="text-sm text-on-surface-variant capitalize">{dayName}</span>
      </div>

      {/* Time rows */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="flex" style={{ minHeight: 64 }}>
            {/* Hour label */}
            <div className="w-12 shrink-0 pr-3 pt-1 text-right text-xs text-muted-foreground select-none">
              {hour}
            </div>
            {/* Event area */}
            <div className="flex-1 border-t border-outline-variant relative">
              {/* Half-hour dashed marker */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-outline-variant/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/AgendaDayGrid.tsx
git commit -m "feat: add AgendaDayGrid placeholder time column"
```

---

## Task 3: Create AgendaDatePicker

**Files:**
- Create: `src/pages/agenda/components/AgendaDatePicker.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDisplayDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year}`
}

interface Props {
  selected: Date
  onSelect: (date: Date) => void
}

export function AgendaDatePicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const [rightYear, setRightYear] = useState(selected.getFullYear())

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    onSelect(day)
    setOpen(false)
  }

  function handleMonthChange(month: Date) {
    setViewMonth(month)
    setRightYear(month.getFullYear())
  }

  function handleMonthGridSelect(monthIndex: number) {
    const next = new Date(rightYear, monthIndex, 1)
    setViewMonth(next)
  }

  function handleToday() {
    const today = new Date()
    onSelect(today)
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setRightYear(today.getFullYear())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-sm font-medium text-on-surface hover:opacity-70 transition-opacity">
          {formatDisplayDate(selected)}
          <ChevronDown className="size-3.5 text-on-surface-variant" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Left panel: monthly calendar */}
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            month={viewMonth}
            onMonthChange={handleMonthChange}
            locale={es}
          />

          {/* Right panel: month grid + year navigation */}
          <div className="border-l border-outline-variant flex flex-col w-36 p-3">
            {/* Year row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-on-surface">{rightYear}</span>
              <div className="flex flex-col">
                <button
                  onClick={() => setRightYear(y => y + 1)}
                  className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
                >
                  <ChevronUp className="size-3" />
                </button>
                <button
                  onClick={() => setRightYear(y => y - 1)}
                  className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
                >
                  <ChevronDown className="size-3" />
                </button>
              </div>
            </div>

            {/* 4×3 month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => {
                const isActive =
                  viewMonth.getMonth() === i && viewMonth.getFullYear() === rightYear
                return (
                  <button
                    key={m}
                    onClick={() => handleMonthGridSelect(i)}
                    className={cn(
                      'rounded py-1.5 text-xs transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-on-surface hover:bg-muted'
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant px-3 py-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleToday}>
            Hoy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors. If `react-day-picker/locale` gives a TS error, check the installed react-day-picker version with `cat node_modules/react-day-picker/package.json | grep '"version"'`. For v8 use `import { es } from 'date-fns/locale'` instead.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/AgendaDatePicker.tsx
git commit -m "feat: add AgendaDatePicker two-panel popover"
```

---

## Task 4: Create AgendaDayNav

**Files:**
- Create: `src/pages/agenda/components/AgendaDayNav.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgendaDatePicker } from './AgendaDatePicker'

function parseDate(s: string | null): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AgendaDayNav() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = parseDate(searchParams.get('date'))

  // Default to today if param is absent
  useEffect(() => {
    if (!searchParams.get('date')) {
      setSearchParams(p => { p.set('date', toParam(new Date())); return p }, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setDate(d: Date) {
    setSearchParams(p => { p.set('date', toParam(d)); return p }, { replace: true })
  }

  function goToday() { setDate(new Date()) }

  function prevDay() {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d)
  }

  function nextDay() {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d)
  }

  return (
    <div className="h-10 border-b border-outline-variant bg-surface flex items-center px-4 gap-2 shrink-0">
      <Button size="sm" variant="outline" onClick={goToday}>
        Hoy
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={prevDay}>
        <ChevronLeft />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={nextDay}>
        <ChevronRight />
      </Button>
      <AgendaDatePicker selected={date} onSelect={setDate} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/components/AgendaDayNav.tsx
git commit -m "feat: add AgendaDayNav secondary header with date navigation"
```

---

## Task 5: Wire up AgendaPage

**Files:**
- Modify: `src/pages/agenda/AgendaPage.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
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

  if (view === 'dia') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <AgendaToolbar />
        <AgendaDayNav />
        <AgendaDayGrid date={date} />
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

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/AgendaPage.tsx
git commit -m "feat: wire up agenda day view with nav header and time grid"
```
