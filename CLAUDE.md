# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Vite HMR)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test runner is configured yet.

## Stack

- **React 19** with TypeScript 5.9, bundled with **Vite 8**
- **React Compiler** enabled via `babel-plugin-react-compiler` — manual `useMemo`/`useCallback` are not needed
- Strict TypeScript (`tsconfig.app.json`): ES2023 target, `bundler` module resolution, `react-jsx` JSX transform
- ESLint flat config (`eslint.config.js`) with `react-hooks` and `react-refresh` plugins

## Project Purpose & Architecture

EvalPro is a clinical evaluation system for healthcare professionals (kinesiology, nutrition, psychology, training). The full system design is documented in **`docs/planning/`** (9 Markdown files in Spanish) — read these before implementing any domain logic.

Key design documents:
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

## Fase actual: Planificación

El proyecto está en **fase de planificación**. Antes de proponer o implementar cualquier funcionalidad, **leer todos los archivos en `docs/planning/`** para entender el sistema completo. Cada documento cubre un aspecto crítico del dominio; implementar sin leerlos llevará a decisiones inconsistentes con el diseño.

El `src/` contiene solo el template de Vite. Nada del dominio ha sido implementado aún. La arquitectura a construir:

- **Routing**: not installed; will need multi-step navigation (red flags → anamnesis P1 → P2 → tests → results → evolution)
- **State management**: not installed; will need to track multi-phase patient sessions, scoring state, and study requests
- **Backend**: planned as Node.js + PostgreSQL (Supabase) + Anthropic Claude API; no API integration exists yet
