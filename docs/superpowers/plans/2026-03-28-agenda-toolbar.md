# Agenda Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sub-navigation toolbar for `/professional/agenda` that controls calendar view mode and event-type filters via URL search params.

**Architecture:** Two-file change. `AgendaToolbar` is a self-contained component that reads and writes `useSearchParams` — no props needed. `AgendaPage` is updated to render the toolbar above the content area. No new shadcn components are installed; the Filtrar multiselect uses a lightweight custom dropdown.

**Tech Stack:** React 19, React Router v7 (`useSearchParams`), lucide-react, existing `Button` component (`@/components/ui/button`), Tailwind CSS v4 custom tokens.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/agenda/AgendaToolbar.tsx` | Toolbar UI + all searchParam state logic |
| Modify | `src/pages/AgendaPage.tsx` | Render toolbar, restructure layout to column flex |

---

## Task 1: Create AgendaToolbar component

**Files:**
- Create: `src/pages/agenda/AgendaToolbar.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Printer, Share2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'dia' | 'semana-laboral' | 'semana' | 'mes'

const TIPOS = [
  { value: 'ingreso',        label: 'Ingreso' },
  { value: 'sesion',         label: 'Sesión' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'otros',          label: 'Otros' },
] as const

type TipoValue = typeof TIPOS[number]['value']

const DIA_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export function AgendaToolbar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtrarOpen, setFiltrarOpen] = useState(false)
  const filtrarRef = useRef<HTMLDivElement>(null)

  const view = (searchParams.get('view') ?? 'mes') as ViewMode
  const dias = Number(searchParams.get('dias') ?? '1')
  const tiposParam = searchParams.get('tipos') ?? ''
  const activeTipos: TipoValue[] = tiposParam
    ? (tiposParam.split(',') as TipoValue[])
    : []

  // Default view to 'mes' on first load
  useEffect(() => {
    if (!searchParams.get('view')) {
      setSearchParams(p => { p.set('view', 'mes'); return p }, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close filtrar dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filtrarRef.current && !filtrarRef.current.contains(e.target as Node)) {
        setFiltrarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function setView(v: ViewMode) {
    setSearchParams(p => { p.set('view', v); return p }, { replace: true })
  }

  function setDias(n: number) {
    setSearchParams(p => { p.set('dias', String(n)); return p }, { replace: true })
  }

  function toggleTipo(tipo: TipoValue) {
    const next = activeTipos.includes(tipo)
      ? activeTipos.filter(t => t !== tipo)
      : [...activeTipos, tipo]
    setSearchParams(p => {
      if (next.length === 0) p.delete('tipos')
      else p.set('tipos', next.join(','))
      return p
    }, { replace: true })
  }

  const isActive = (v: ViewMode) => view === v

  const filtrarLabel = activeTipos.length > 0
    ? `Filtrar (${activeTipos.length})`
    : 'Filtrar'

  return (
    <div className="h-12 border-b border-outline-variant bg-surface-container-low flex items-center justify-between px-4 shrink-0">

      {/* Left: action */}
      <div className="flex items-center gap-1">
        <Button size="sm">Ingresar paciente</Button>
        <Button size="icon-sm" variant="outline">
          <ChevronDown />
        </Button>
      </div>

      {/* Center: view toggles */}
      <div className="flex items-center gap-1">
        {/* Día — button + inline select when active */}
        <div className="flex items-center">
          <button
            onClick={() => setView('dia')}
            className={cn(
              'h-7 px-3 text-sm transition-colors',
              isActive('dia')
                ? 'rounded-l-md border border-outline bg-surface-container-highest text-on-surface font-medium'
                : 'rounded-md border border-transparent text-on-surface-variant hover:text-on-surface hover:bg-muted'
            )}
          >
            Día
          </button>
          {isActive('dia') && (
            <select
              value={dias}
              onChange={e => setDias(Number(e.target.value))}
              className="h-7 rounded-r-md border border-l-0 border-outline bg-surface-container-highest text-on-surface text-sm px-1 outline-none cursor-pointer"
            >
              {DIA_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'día' : 'días'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Semana laboral, Semana, Mes */}
        {(['semana-laboral', 'semana', 'mes'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'h-7 px-3 text-sm rounded-md border transition-colors',
              isActive(v)
                ? 'border-outline bg-surface-container-highest text-on-surface font-medium'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-muted'
            )}
          >
            {v === 'semana-laboral' ? 'Semana laboral' : v === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1">
        {/* Filtrar multiselect */}
        <div className="relative" ref={filtrarRef}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFiltrarOpen(o => !o)}
          >
            <SlidersHorizontal className="size-3.5" />
            {filtrarLabel}
            <ChevronDown className="size-3" />
          </Button>
          {filtrarOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-outline-variant bg-surface-container py-1 shadow-lg z-50">
              {TIPOS.map(tipo => (
                <label
                  key={tipo.value}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-high cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={activeTipos.includes(tipo.value)}
                    onChange={() => toggleTipo(tipo.value)}
                    className="accent-primary"
                  />
                  {tipo.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <Button size="icon-sm" variant="ghost">
          <Share2 />
        </Button>
        <Button size="icon-sm" variant="ghost">
          <Printer />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "^.*error"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/agenda/AgendaToolbar.tsx
git commit -m "feat: add AgendaToolbar with view toggles and filter multiselect"
```

---

## Task 2: Update AgendaPage to render the toolbar

**Files:**
- Modify: `src/pages/AgendaPage.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { AgendaToolbar } from './agenda/AgendaToolbar'

export function AgendaPage() {
  return (
    <div className="flex flex-col h-full">
      <AgendaToolbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
          <h2 className="font-display text-2xl font-semibold text-on-surface">Agenda</h2>
          <p className="text-on-surface-variant text-xs">En construcción</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "^.*error"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AgendaPage.tsx
git commit -m "feat: integrate AgendaToolbar into AgendaPage"
```
