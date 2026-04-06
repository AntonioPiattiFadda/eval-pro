# Login Screen Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Login page (desktop + mobile), Supabase auth integration, design system foundation

> **Note:** The planning docs (`docs/planning/09_consideraciones.md`) reference Next.js as the recommended frontend. This project uses Vite + React with client-side routing. The planning docs will be updated separately.

---

## 1. Overview

Implement the EvalPro login screens faithful to the Stitch "Kinetic Login" designs (desktop and mobile), with Supabase authentication. This is the first real UI component of the app and establishes the design system foundation (Tailwind + shadcn/ui + CSS variables).

---

## 2. File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx         # Auth state, AuthProvider, useAuth hook
├── lib/
│   └── supabase.ts             # Supabase createClient (reads env vars)
├── pages/
│   └── LoginPage.tsx           # Single responsive login component
├── App.tsx                     # Renders <LoginPage /> (replaces Vite template)
└── main.tsx                    # Wraps <App /> with <AuthProvider>

docs/
└── design/
    └── DESIGN.md               # Design system: tokens, rules, component guidelines

.env.example                    # Env var template for new developers
```

> `App.tsx` is updated to render only `<LoginPage />`, replacing the existing Vite template content.

---

## 3. Design System

### 3.1 `docs/design/DESIGN.md`

Documents the "Kinetic Editorial" design system used across EvalPro:
- Full color token reference
- Typography scale (Lexend for headlines, Plus Jakarta Sans for body/labels)
- Spacing scale
- Elevation rules (no 1px borders — use tonal shifts and negative space)
- Component guidelines (buttons, inputs, cards)

### 3.2 CSS Custom Properties (`index.css`)

Single source of truth for all design tokens. The CSS token list below is the complete set; `DESIGN.md` is the reference document.

```css
:root {
  /* Surfaces */
  --color-background:               #0e0e0e;
  --color-surface:                  #0e0e0e;
  --color-surface-dim:              #0e0e0e;
  --color-surface-bright:           #2c2c2c;
  --color-surface-container-lowest: #000000;
  --color-surface-container-low:    #131313;
  --color-surface-container:        #191a1a;
  --color-surface-container-high:   #1f2020;
  --color-surface-container-highest:#262626;

  /* Primary */
  --color-primary:                  #ff8f6f;
  --color-primary-action:           #FF5722;
  --color-primary-container:        #ff7851;
  --color-on-primary:               #5c1400;
  --color-on-primary-container:     #470e00;
  --color-primary-fixed:            #ff7851;

  /* Text */
  --color-on-surface:               #ffffff;
  --color-on-surface-variant:       #acabaa;

  /* Utility */
  --color-outline:                  #767575;
  --color-outline-variant:          #484848;
  --color-error:                    #ff716c;
  --color-error-container:          #9f0519;

  /* Typography */
  --font-display: 'Lexend', sans-serif;
  --font-body:    'Plus Jakarta Sans', sans-serif;
}
```

### 3.3 Tailwind Configuration (v4)

Tailwind v4 uses CSS-first configuration. Theme tokens are declared directly in `index.css` using the `@theme` directive — no `tailwind.config.ts` needed for color/font tokens:

```css
@import "tailwindcss";

@theme {
  --color-background:               var(--color-background);
  --color-surface-container-low:    var(--color-surface-container-low);
  --color-primary:                  var(--color-primary);
  --color-on-surface:               var(--color-on-surface);
  --color-on-surface-variant:       var(--color-on-surface-variant);
  --color-error:                    var(--color-error);
  --font-family-display:            var(--font-display);
  --font-family-body:               var(--font-body);
}
```

This allows using Tailwind classes like `bg-background`, `text-primary`, `font-display`, etc.

### 3.4 shadcn/ui

Used for: `Input`, `Button`, `Form` (React Hook Form + Zod).
shadcn components are customized to use the project's CSS variables, not the default shadcn palette. Run `npx shadcn@latest init` and select the CSS variables option.

---

## 4. Auth Architecture

### 4.1 `lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY
)
```

### 4.2 `AuthContext.tsx`

Exposes via context:

| Property | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current Supabase user |
| `loading` | `boolean` | True while checking initial session on mount |
| `signInWithEmail` | `(email, password) => Promise<AuthError \| null>` | Returns raw Supabase error or null |
| `signInWithGoogle` | `() => Promise<AuthError \| null>` | Google OAuth redirect; returns error if redirect initiation fails |
| `signInWithApple` | `() => Promise<AuthError \| null>` | Apple OAuth redirect; returns error if redirect initiation fails |
| `signOut` | `() => Promise<void>` | Sign out |

`AuthProvider` subscribes to `supabase.auth.onAuthStateChange` for reactive session updates.

**Error responsibility:** `AuthContext` returns raw `AuthError` objects without transformation. `LoginPage` is responsible for mapping error codes to user-facing strings.

---

## 5. LoginPage Component

### 5.1 Layout

Single `LoginPage.tsx` responsive via Tailwind breakpoints:

- **Mobile (`< md`):** Vertical layout — logo top, form centered, social buttons stacked
- **Desktop (`≥ md`):** Two-column — left panel (branding + visual), right panel (form)

Faithful to Stitch designs: "Kinetic Login" (desktop) and "Kinetic Login Mobile".

**Loading state:** While `AuthContext.loading` is true (checking initial session), `LoginPage` renders a full-screen blank surface (`bg-background`) to prevent a flash of the login form for already-authenticated users.

### 5.2 Form

- Fields: `email` + `password`
- Validation: Zod schema via React Hook Form
  - Email: valid format, required
  - Password: required, min 6 chars
- Submit triggers `signInWithEmail` from `useAuth()`
- Button shows loading spinner during request
- On error: password field is NOT cleared; only visual error state applied

### 5.3 Social Login

- Google button → `signInWithGoogle()`
- Apple button → `signInWithApple()`
- Uses Supabase OAuth redirect flow
- On mount, `LoginPage` checks `window.location.search` for `?error=` param (Supabase appends this on failed OAuth callbacks) and displays the error if present

### 5.4 Error Handling

`LoginPage` maps `AuthError` codes to user-facing messages. Error displayed below the submit/social button area:

| Scenario | User-facing message |
|---|---|
| `invalid_credentials` | "Email o contraseña incorrectos" |
| `email_not_confirmed` | "Confirmá tu email antes de ingresar" |
| `too_many_requests` | "Demasiados intentos. Esperá unos minutos" |
| Network/fetch failure | "Sin conexión. Verificá tu internet" |
| OAuth redirect initiation failure | "No se pudo conectar con el proveedor. Intentá de nuevo" |
| OAuth `?error=` param in URL (callback) | "Error al autenticar con proveedor externo" |
| OAuth cancelled (user closed popup) | Silent — no message shown |
| Generic/unknown | "Ocurrió un error. Intentá de nuevo" |

---

## 6. Dependencies to Install

| Package | Purpose |
|---|---|
| `tailwindcss` + `@tailwindcss/vite` | Utility CSS (v4) |
| `@supabase/supabase-js` | Auth client |
| `shadcn/ui` (via CLI) | Component library |
| `react-hook-form` | Form state management |
| `zod` | Schema validation |
| `@hookform/resolvers` | Connects Zod to RHF |

Fonts (Lexend + Plus Jakarta Sans) loaded via Google Fonts `<link>` in `index.html`.

---

## 7. Environment Variables

**`.env.example`** (committed to repo):
```env
VITE_APP_SUPABASE_URL=your-supabase-project-url
VITE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**`.env`** (gitignored — developer fills in real values):
```env
VITE_APP_SUPABASE_URL=...
VITE_APP_SUPABASE_ANON_KEY=...
```

---

## 8. Out of Scope

- Registration / sign-up flow
- Password reset flow
- Route protection / redirect after login (no router yet)
- Dedicated `/auth/callback` route (deferred until router is added)
- Any screen other than the login page
