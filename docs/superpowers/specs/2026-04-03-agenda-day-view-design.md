# Agenda — Day View: Nav Header + Time Grid

**Date:** 2026-04-03
**Scope:** Day view sub-header with date navigation and a placeholder time-slot grid. No appointment data rendering yet.

---

## Overview

When the agenda is in `view=dia` mode, a secondary header appears below the main `AgendaToolbar`. It lets the user navigate by day and pick a date via a two-panel datepicker. Below that, a time-slot column grid (placeholder) shows hours from 8 to 20.

---

## State

Selected date lives in URL search params: `?date=YYYY-MM-DD`.

- Default: today's date (set on first render if `date` param is absent)
- Consistent with how `view`, `dias`, and `tipos` are already managed in `AgendaToolbar`
- Makes the URL shareable and survives refresh

---

## Components

### `AgendaDayNav` — `pages/agenda/components/AgendaDayNav.tsx`

Secondary header bar rendered inside `AgendaPage` when `view === 'dia'`.

Layout (left-aligned, flex row, gap):
```
[ Hoy ]  [ < ]  [ > ]   3 Abril, 2026 ▾
```

- **Hoy button**: sets `date` param to today
- **`<` / `>` icon buttons**: decrement / increment the date by one day
- **Date button** (`"3 Abril, 2026 ▾"`): opens `AgendaDatePicker` in a Popover

Date formatting: `es-AR` locale — `"3 Abril, 2026"` (day + capitalized month + year, no leading zero).

---

### `AgendaDatePicker` — `pages/agenda/components/AgendaDatePicker.tsx`

Two-panel dropdown rendered inside a Radix/shadcn Popover:

**Left panel — day calendar**
- shadcn `Calendar` component (single month)
- Header shows current month + year with prev/next month arrows
- Weekday row: L M X J V S D
- Selected day highlighted in filled primary circle
- Today's date highlighted in a lighter ring when not selected

**Right panel — month grid**
- Year displayed at top with up/down arrows to change year
- 4×3 grid of month abbreviations: Ene Feb Mar / Abr May Jun / Jul Ago Sep / Oct Nov Dic
- Active month highlighted (filled primary background)

**Footer**
- "Hoy" button (bottom-right) sets both panels to today and selects today's date

**Behavior**
- Left and right panels are synced — navigating months in the left panel updates the right panel's highlighted month, and vice versa
- Clicking a day in the left panel selects that date, updates the `date` URL param, and closes the Popover

---

### `AgendaDayGrid` — `pages/agenda/components/AgendaDayGrid.tsx`

Placeholder time-slot column for the selected day.

**Day header**
- Full-width column header showing: large day number + day name (e.g. `3` / `Viernes`)
- Today's date number shown in a filled primary circle

**Time rows**
- Hours 8 through 20 (inclusive), one row per hour
- Each row ~64px tall with a solid top border for the hour and a dashed mid-row line for the half-hour
- Hour label on the left (`8`, `9`, ... `20`) in small muted text
- Event area to the right: empty for now

---

## Integration — `AgendaPage`

`AgendaPage` reads `view` from `useSearchParams`:

- `view === 'dia'`: render `<AgendaDayNav />` + `<AgendaDayGrid />`
- any other view: keep existing content (title + `NewAppointmentDialog` + `AppointmentList`)

The top-level `AgendaToolbar` is untouched.

---

## Packages to install

```bash
npx shadcn@latest add calendar popover
```

Adds `react-day-picker` (peer dep of shadcn Calendar), `@radix-ui/react-popover`, and the two shadcn UI files:
- `src/components/ui/calendar.tsx`
- `src/components/ui/popover.tsx`

---

## File Map

| Action | Path |
|--------|------|
| Install | shadcn Calendar + Popover |
| Create | `src/pages/agenda/components/AgendaDayNav.tsx` |
| Create | `src/pages/agenda/components/AgendaDatePicker.tsx` |
| Create | `src/pages/agenda/components/AgendaDayGrid.tsx` |
| Modify | `src/pages/agenda/AgendaPage.tsx` |

---

## Out of scope

- Rendering actual appointment data in the grid
- Week and month views
- Drag-and-drop or resizing events
- Multi-day column headers (the `dias` selector in AgendaToolbar will handle this later)
