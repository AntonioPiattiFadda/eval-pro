# EvalPro — Supabase Auth Flow Design

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Full authentication flow with role-based routing

---

## Overview

Implement a complete Supabase authentication flow for EvalPro using React Router v7 with nested layout routes. Two user roles (`profesional`, `client`) have completely separate route trees and UIs. Auth state (session + role) is managed centrally in `AuthContext`.

---

## 1. Architecture

### Router structure

React Router v7 (`react-router-dom`) with `<BrowserRouter>` + `<Routes>` declared in `App.tsx`. Three layout branches:

- **`AuthLayout`** — public shell. Wraps all auth pages. Redirects authenticated users to their role's home.
- **`ProfesionalLayout`** — protected shell. Guards all `/profesional/*` routes. Redirects unauthenticated users to `/login`; wrong-role users to `/client/dashboard`.
- **`ClientLayout`** — protected shell. Guards all `/client/*` routes. Mirror of `ProfesionalLayout`.

### Route map

```
/                             → RootRedirect (auth+role-aware redirect)
<AuthLayout>
  /login                      → LoginPage
  /register                   → RegisterPage
  /forgot-password            → ForgotPasswordPage
  /reset-password             → ResetPasswordPage
<ProfesionalLayout>
  /profesional/dashboard      → ProfesionalDashboard (placeholder)
<ClientLayout>
  /client/dashboard           → ClientDashboard (placeholder)
```

---

## 2. AuthContext

### Extended state

```ts
interface Profile {
  role: 'profesional' | 'client'
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean  // true until session AND profile are resolved
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>
  signInWithGoogle: () => Promise<AuthError | null>
  signInWithApple: () => Promise<AuthError | null>
  signOut: () => Promise<void>
}
```

### Profile fetch logic

1. `getSession()` resolves → if session exists, query `supabase.from('users').select('role').eq('id', user.id).single()`
2. `loading` remains `true` until both calls complete
3. `onAuthStateChange` re-fetches profile on every session change (login, logout, token refresh)
4. `signOut` clears both `user` and `profile`

---

## 3. Auth Pages

All four auth pages live inside `AuthLayout`, which owns the split-panel shell (left branding, right form) currently in `LoginPage`.

### LoginPage (`/login`)
- Email + password fields (existing implementation)
- Google + Apple OAuth buttons (existing)
- Error mapping (existing)
- New: "Don't have an account? Register" link → `/register`
- New: "Forgot password?" link → `/forgot-password`
- Remove: own split-panel shell (moved to `AuthLayout`)

### RegisterPage (`/register`)
- Fields: email, password, confirm password
- Zod schema: email valid, password min 6 chars, passwords match
- On success: Supabase sends confirmation email → show "check your inbox" success state (no redirect)
- Link: "Already have an account? Sign in" → `/login`

### ForgotPasswordPage (`/forgot-password`)
- Field: email only
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/reset-password' })`
- On success: show "check your inbox" success state
- Link: "Back to sign in" → `/login`

### ResetPasswordPage (`/reset-password`)
- Fields: new password, confirm password
- Supabase email link lands here; `onAuthStateChange` fires `PASSWORD_RECOVERY` event enabling the form
- On success: redirect to `/login`
- Shows loading state until `PASSWORD_RECOVERY` event received or timeout

---

## 4. Layout Components

### AuthLayout
- Renders the split-panel shell (left: branding, right: `<Outlet />`)
- On mount: if `!loading && user`, redirect to role home (`/profesional/dashboard` or `/client/dashboard`)
- Shows blank screen while `loading` (prevents flash)

### ProfesionalLayout
- On mount: if `!loading && !user` → redirect to `/login`
- On mount: if `!loading && profile?.role !== 'profesional'` → redirect to `/client/dashboard`
- Renders: minimal top bar (user email + sign-out button) + `<Outlet />`

### ClientLayout
- Mirror of `ProfesionalLayout` for `client` role
- Wrong role redirects to `/profesional/dashboard`

### RootRedirect (`/`)
- Reads `loading`, `user`, `profile`
- Shows blank screen while loading
- `!user` → `/login`
- `role === 'profesional'` → `/profesional/dashboard`
- `role === 'client'` → `/client/dashboard`

---

## 5. Dashboard Placeholders

Both dashboards are minimal placeholders — a centered card showing the user's email and role. They will be replaced by full domain-specific UIs in future iterations.

- `ProfesionalDashboard`: "Bienvenido, [email]. Panel de profesional — en construcción."
- `ClientDashboard`: "Bienvenido, [email]. Panel de cliente — en construcción."

---

## 6. File Map

| File | Change |
|---|---|
| `src/contexts/AuthContext.tsx` | Add `profile` state + role fetch from `users` table |
| `src/App.tsx` | Full route config with React Router v7 |
| `src/layouts/AuthLayout.tsx` | New — public split-panel shell with role-aware redirect |
| `src/layouts/ProfesionalLayout.tsx` | New — protected layout, role-gated |
| `src/layouts/ClientLayout.tsx` | New — protected layout, role-gated |
| `src/pages/LoginPage.tsx` | Remove own shell; add nav links |
| `src/pages/RegisterPage.tsx` | New |
| `src/pages/ForgotPasswordPage.tsx` | New |
| `src/pages/ResetPasswordPage.tsx` | New |
| `src/pages/ProfesionalDashboard.tsx` | New placeholder |
| `src/pages/ClientDashboard.tsx` | New placeholder |

---

## 7. Dependencies

- `react-router-dom` v7 — to be installed

No other new dependencies. All validation, form, and UI patterns follow the existing `LoginPage` conventions (Zod, react-hook-form, shadcn/ui components).

---

## 8. Error & Edge Cases

- **Profile fetch fails:** treat as unauthenticated (clear session, redirect to `/login` with generic error)
- **Unknown role:** redirect to `/login` with error
- **OAuth callback errors:** existing URL `?error` param handling in `LoginPage` covers this
- **`PASSWORD_RECOVERY` timeout:** show "link expired" message with link back to `/forgot-password`
