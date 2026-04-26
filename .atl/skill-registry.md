# Skill Registry — eval-pro-frontend

Generated: 2026-04-26
Project: eval-pro-frontend

## User Skills

| Skill | Trigger |
|-------|---------|
| `sdd-explore` | Investigate a feature or idea before committing to a change |
| `sdd-propose` | Create a change proposal with intent, scope, and approach |
| `sdd-spec` | Write specifications with requirements and scenarios |
| `sdd-design` | Create technical design document with architecture decisions |
| `sdd-tasks` | Break down a change into an implementation task checklist |
| `sdd-apply` | Implement tasks from the change |
| `sdd-verify` | Validate that implementation matches specs, design, and tasks |
| `sdd-archive` | Sync delta specs to main specs and archive a completed change |
| `sdd-init` | Initialize SDD context in the project |
| `sdd-onboard` | Guided end-to-end walkthrough of the SDD workflow |
| `branch-pr` | Creating a pull request, opening a PR, preparing changes for review |
| `issue-creation` | Creating a GitHub issue, reporting a bug, requesting a feature |
| `judgment-day` | Adversarial dual-review: "judgment day", "doble review", "que lo juzguen" |
| `skill-creator` | Creating new AI agent skills or documenting patterns |

## Project Conventions

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions, folder structure, stack, SDD workflow |
| `docs/planning/` | Business logic, app flow, DB schema — source of truth for domain |
| `docs/design/DESIGN.md` | UI design guidelines, component patterns |
| `docs/design/css.variables.md` | CSS custom properties (colors, spacing, typography) |

## Compact Rules

### All tasks (React/TypeScript frontend)
- Stack: React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4
- React Compiler enabled — do NOT add manual `useMemo`/`useCallback`
- Path alias `@/` maps to `src/`
- Page-based architecture: `pages/<name>/{components,hooks,services,types}/<Name>Page.tsx`
- Shared (2+ pages) → `src/components/` or `src/service/`; single-page → `pages/<name>/`
- No business logic in page entry point files
- Global types → `src/types/`; page-specific → `pages/<name>/types/`

### Data & mutations
- Every DB mutation MUST show a loading toast using Sonner id pattern
- `toast.success` on success, `toast.error(err.message)` on error (auto 16s)
- Do NOT use toasts for form validation — use react-hook-form + Zod inline errors
- Supabase client in `src/lib/`; shared DB services in `src/service/`

### Business logic decisions
- ALWAYS read `docs/planning/` before implementing domain logic
- ALWAYS read `docs/design/` before making UI decisions

### SDD workflow
- New feature, route, or domain logic → use `/sdd-new` or `/sdd-ff`
- Architecture or schema decision → use SDD
- Bug fix or small UI tweak (< 1 file) → inline OK
