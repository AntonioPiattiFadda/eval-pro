# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow — Gentle AI SDD (Mandatory)

**Prioritize Gentle AI SDD tools for all non-trivial tasks.** Before writing any code or making architectural decisions, use the SDD workflow:

- `/sdd-new <change>` — start any new feature, refactor, or substantial change
- `/sdd-ff <change>` — fast-forward through proposal → specs → design → tasks in one shot
- `/sdd-continue` — resume a change in progress
- `/sdd-apply` — implement tasks (run after planning phases)
- `/sdd-verify` — validate implementation against specs
- `/sdd-archive` — close and persist a completed change

**When to use SDD vs inline:**
- New feature, route, or domain logic → **always SDD**
- Architecture or schema decision → **always SDD**
- Bug fix or small UI tweak (< 1 file) → inline is fine
- Anything touching `docs/planning/` domain → **always SDD**

Run `/sdd-init` once per session if SDD context is not already initialized.

## Commands

```bash
npm run dev       # Start development server (Vite HMR)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
npm run test      # Vitest in watch mode (unit + integration)
npm run test:run  # Vitest single run (CI)
npm run e2e       # Playwright E2E tests
```

## Testing — Strict TDD Mode ENABLED

**Every feature MUST include tests.** No exceptions.

### Unit / Integration — Vitest + Testing Library
- Test files live next to the code: `foo.test.ts` or `foo.test.tsx`
- Location follows the same page-based architecture: `pages/<name>/components/Foo.test.tsx`
- Setup file: `src/test/setup.ts` (imports jest-dom matchers)
- Run: `npm run test`

**What to test:**
- Hooks: business logic, state transitions, error handling
- Services: data transformation, error mapping
- Components: user interactions, conditional rendering, form validation

### E2E — Playwright
- Test files live in `e2e/` at the project root
- Tests the full user flow in a real browser (Chromium)
- Use for critical paths: login, evaluation wizard, scoring flow
- Run: `npm run e2e` (starts dev server automatically)

### Rule
When implementing a feature via `/sdd-apply`, tests are part of the task — not an afterthought. The `sdd-verify` phase checks test coverage.

## Toasts

Uses **Sonner** via the configured wrapper at `src/components/ui/sonner.tsx`. Import `toast` from `"sonner"` directly in components.

**Rules:**
- `toast.success` — mutation completed successfully
- `toast.error` — mutation failed. Always pass `err.message`. Automatically lasts 16s.
- **Every DB mutation must show a loading toast.** Use the id pattern to replace it on completion:

```typescript
const toastId = 'unique-id'
useMutation({
  onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
  onSuccess: () => { toast.success('Listo', { id: toastId }) },
  onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
})
```

- Do NOT use toasts for form validation — use inline messages via react-hook-form + Zod.
- All toasts have `closeButton` enabled automatically via the Toaster wrapper.

## Stack

- **React 19** with TypeScript 5.9, bundled with **Vite 8**
- **React Compiler** enabled via `babel-plugin-react-compiler` — manual `useMemo`/`useCallback` are not needed
- Strict TypeScript (`tsconfig.app.json`): ES2023 target, `bundler` module resolution, `react-jsx` JSX transform
- ESLint flat config (`eslint.config.js`) with `react-hooks` and `react-refresh` plugins

## Project Purpose & Architecture

EvalPro is a clinical evaluation system for healthcare professionals (kinesiology, nutrition, psychology, training).

### Business Logic & App Flow → `docs/planning/`

**Before making any business logic or flow decision, read the relevant files in `docs/planning/`.** This is the source of truth for how the app works end-to-end.

Key planning documents:
- `01_flujo_global.md` — Full patient evaluation flow: red flags → anamnesis (phases 1-2) → tests (phase 3) → scoring → diagnosis → interventions → evolution
- `02_base_de_datos.md` — 31-table database schema across 9 categories
- `03_motor_scoring.md` — Hybrid scoring engine: Layer 1 (simple sum) + Layer 2 (Bayesian), clusters, negative weights
- `04_estudios_complementarios.md` — Imaging/lab study workflow injected into scoring
- `05_sistema_regional.md` — Regional chains (connected anatomical areas)
- `06_banderas_rojas.md` — Red flag triggers by domain (URGENTE/ALTA priority)
- `07_evolucion.md` — Session-to-session progress tracking and regression alerts
- `08_scoring_dominio.md` — Worked evaluation examples per domain
- `09_consideraciones.md` — Architecture principles, nomenclature, system numbers, recommended backend (Node/Supabase/Claude API/Vercel)
- `10_intervenciones.md` — Intervention layer: manual therapy, therapeutic exercise, physical agents/electrotherapy, catalog, rules table, contraindications, cross-domain triggers

### UI Design → `docs/design/`

**Before making any UI or visual decision, read the relevant files in `docs/design/`.** This is the source of truth for design system, visual language, and component behavior.

- `docs/design/DESIGN.md` — Overall UI design guidelines, component patterns, and visual decisions
- `docs/design/css.variables.md` — CSS custom properties (colors, spacing, typography, etc.)

## Supabase MCP

El servidor MCP de Supabase está configurado en `.mcp.json` apuntando al proyecto de desarrollo (`project_ref=eouzhpwtycsnokkeiyzh`). Este proyecto **aún no es producción** — contiene datos de desarrollo/pruebas, por lo que el modo escritura es seguro en esta etapa.

**Cuando el proyecto pase a producción:** crear un proyecto Supabase separado para desarrollo y actualizar el `project_ref` en `.mcp.json` para que nunca apunte al proyecto con datos reales de pacientes.

## Folder Structure — Page-Based Architecture

### Global `src/`

```
src/
  assets/          # static files (images, svgs)
  components/      # shared UI components used in 2+ pages (shadcn/ui + custom)
  contexts/        # global React contexts (AuthContext, etc.)
  hooks/           # shared hooks used in 2+ pages
  layouts/         # route-level layouts (AuthLayout, ProfesionalLayout, etc.)
  lib/             # technical utilities: supabase client, cn(), formatters, etc.
  service/         # DB/API functions shared across multiple pages (auth, profiles, etc.)
  types/           # global types (User, Role, Profile, etc.)
  pages/           # one folder per page/route (see below)
  App.tsx
  main.tsx
```

### Page structure

Each page folder follows this internal layout:

```
pages/<name>/
  components/    # UI components used only within this page
  hooks/         # local hooks (e.g., useAgendaFilters)
  services/      # Supabase/API calls specific to this page
  types/         # domain types for this page
  <Name>Page.tsx # page entry point (route component)
```

Simple pages with no sub-components can be a single file: `pages/SimplePage.tsx`.

### Rules

1. **Component sharing:** If a component is used in only one page → `pages/<name>/components/`. If used in 2+ pages → `src/components/`.
2. **Service sharing:** If a service is used in only one page → `pages/<name>/services/`. If used in 2+ pages → `src/service/`.
3. **No business logic in page entry point:** Page files orchestrate layout and composition. Logic belongs in hooks or services.
4. **Types sharing:** Global types (User, Role, etc.) → `src/types/`. Page-specific types → `pages/<name>/types/`.

---

## Fase actual: Planificación

El proyecto está en **fase de planificación**. Antes de proponer o implementar cualquier funcionalidad, **leer todos los archivos en `docs/planning/`** para entender el sistema completo. Cada documento cubre un aspecto crítico del dominio; implementar sin leerlos llevará a decisiones inconsistentes con el diseño.

El `src/` contiene solo el template de Vite. Nada del dominio ha sido implementado aún. La arquitectura a construir:

- **Routing**: not installed; will need multi-step navigation (red flags → anamnesis P1 → P2 → tests → results → evolution)
- **State management**: not installed; will need to track multi-phase patient sessions, scoring state, and study requests
- **Backend**: planned as Node.js + PostgreSQL (Supabase) + Anthropic Claude API; no API integration exists yet
