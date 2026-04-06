# Clean Architecture — Folder Structure Design

**Date:** 2026-03-29
**Status:** Approved

## Overview

Feature-based clean architecture for the EvalPro frontend. Each domain of the system lives in its own feature folder with internal layers. Shared code lives at the `src/` root level.

---

## Global `src/` Structure

```
src/
  assets/              # static files (images, svgs)
  components/          # shared UI components used in 2+ features (shadcn/ui + custom)
  contexts/            # global React contexts (AuthContext, etc.)
  hooks/               # shared hooks used in 2+ features
  layouts/             # route-level layout components (AuthLayout, ProfesionalLayout, etc.)
  lib/                 # technical utilities: supabase client, cn(), formatters, etc.
  services/            # DB/API functions shared across multiple features
  types/               # global types (User, Role, Profile, etc.)
  features/            # one folder per domain — see Feature Structure below
  pages/               # only re-exports or pages that don't belong to any feature
  App.tsx
  main.tsx
```

---

## Feature Structure

Each feature follows this internal layout:

```
features/<feature-name>/
  components/    # UI components used only within this feature
  hooks/         # local hooks (e.g., useAgenda, useAgendaFilters)
  services/      # Supabase/API calls specific to this feature
  adapters/      # transform raw DB/API responses ↔ domain types
  types/         # domain types for this feature
  pages/         # page-level components (e.g., AgendaPage.tsx)
  index.ts       # barrel export — the public API of this feature
```

### Known features (from domain docs)

```
features/
  auth/
  agenda/
  pacientes/
  evaluaciones/
  scoring/
  intervenciones/
  evolucion/
```

---

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `pages/` | Route entry points. Compose layout + feature components. Minimal logic. |
| `components/` | Pure/presentational UI. No direct Supabase calls. |
| `hooks/` | Business logic, state, side effects. Calls services. |
| `services/` | All Supabase/API calls. Returns raw or typed data. No UI logic. |
| `adapters/` | Convert raw DB/API shape → domain type (and vice versa). No business logic. |
| `types/` | TypeScript interfaces and types. No runtime code. |

---

## Rules

1. **Component sharing rule:** If a component is used in only one feature, it lives in `features/<name>/components/`. If it's used in 2 or more features, it moves to `src/components/`.

2. **Adapters are pure transformers:** They only map data shapes. No conditionals based on business rules, no API calls, no UI logic.

3. **Services never import from components or hooks.** Dependency direction: `pages → hooks → services → adapters → types`.

4. **Feature public API via `index.ts`:** Other features or pages import from `features/<name>/index.ts`, never directly from internal files.

5. **Global `services/` for shared DB functions:** Auth, profile fetching, and other cross-feature DB operations live in `src/services/`, not inside a feature.

6. **No business logic in `pages/`:** Pages orchestrate but don't compute. Logic belongs in hooks.
