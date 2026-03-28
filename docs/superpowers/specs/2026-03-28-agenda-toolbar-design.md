# Agenda Toolbar Design

## Overview

A sub-navigation toolbar rendered at the top of the `/professional/agenda` route, below the main app header. Controls the calendar view mode and event type filters via URL search params so any child component can read state without prop drilling.

## Component

**File:** `src/pages/agenda/AgendaToolbar.tsx`
**Used by:** `src/pages/AgendaPage.tsx` — rendered above the calendar content area.

## Search Params

| Param | Type | Values | Default | Notes |
|-------|------|--------|---------|-------|
| `view` | string | `dia`, `semana-laboral`, `semana`, `mes` | `mes` | Active calendar view |
| `dias` | number | `1`–`7` | `1` | Only meaningful when `view=dia` |
| `tipos` | string | comma-separated: `ingreso`, `sesion`, `administrativo`, `otros` | `""` (empty = all) | Active event type filters |

All state changes use `setSearchParams` (React Router) with `{ replace: true }` to avoid polluting browser history.

## Layout

Three zones in a single horizontal bar with a bottom border:

### Left — Action
- **"Ingresar paciente"** — primary button (uses existing `Button` component, `variant="default"`)
- **Chevron dropdown** — secondary button with a `ChevronDown` icon, placeholder (no action)

### Center — View Toggle
Four toggle buttons styled as a connected group:

1. **Día** — when active, shows an inline `<select>` with options `1 día` through `7 días`. Selecting a value sets `dias=N` in searchParams. Clicking "Día" when inactive sets `view=dia`.
2. **Semana laboral** — sets `view=semana-laboral`
3. **Semana** — sets `view=semana`
4. **Mes** — sets `view=mes` (default active on first load)

Active toggle: `bg-surface-container-highest` + visible border. Inactive: ghost/transparent.

### Right — Utilities
- **Filtrar** — a multiselect popover with four checkboxes: Ingreso, Sesión, Administrativo, Otros. Selected types are stored as `tipos=ingreso,sesion` (comma-separated). Empty = all types shown. Button label shows "Filtrar" when nothing selected, "Filtrar (N)" when N types are active.
- **Compartir** — placeholder icon button (`Share2` icon)
- **Imprimir** — placeholder icon button (`Printer` icon)

## Behaviour

- On mount with no `view` param: default to `mes` via `setSearchParams` with `replace: true`
- On mount with no `dias` param: default to `1` (no redirect needed — consumers default internally)
- `tipos` empty string and absent param are equivalent — both mean "show all"
- The toolbar does not own a calendar; it only manages URL state. The calendar component (future) reads the same params independently.

## Styling

Follows existing project design system:
- Background: `bg-surface-container-low`
- Border: `border-b border-outline-variant`
- Height: `h-12` (48px)
- Horizontal padding: `px-4`
- Font: inherits body (`Plus Jakarta Sans Variable`)
- Primary button: existing `Button` component default variant (orange `#FF5722`)
