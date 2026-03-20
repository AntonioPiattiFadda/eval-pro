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

> **Architectural constraint:** `AuthProvider` is mounted in `main.tsx` outside `BrowserRouter`. `AuthContext` must therefore never call `useNavigate` — all navigation side-effects are handled by layout guards reacting to auth state changes via `<Navigate>`. This is intentional: it keeps `AuthContext` router-agnostic.

- **`AuthLayout`** — public shell. Wraps all auth pages. Redirects authenticated users to their role's home.
- **`ProfesionalLayout`** — protected shell. Guards all `/profesional/*` routes. Redirects unauthenticated users to `/login`; wrong-role users to `/client/dashboard`.
- **`ClientLayout`** — protected shell. Guards all `/client/*` routes. Mirror of `ProfesionalLayout`.

### Route map

```
/                             → RootRedirect (auth+role-aware redirect, inlined in App.tsx)
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
  loading: boolean  // true until BOTH session AND profile are fully resolved
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>
  signInWithGoogle: () => Promise<AuthError | null>
  signInWithApple: () => Promise<AuthError | null>
  signOut: () => Promise<void>
}
```

### Single canonical fetch path

**All auth state is driven exclusively by `onAuthStateChange`.** The standalone `getSession()` call in the existing code is removed. In Supabase JS v2, `onAuthStateChange` eventually fires `INITIAL_SESSION` on mount — either immediately (micro-task) or after a network call if the token needs refreshing. Because `loading` remains `true` until the handler fires, all layout guards are blocked from running until both `user` and `profile` are fully resolved. This is the safety gate that makes `getSession()` redundant and eliminates the dual-fetch race condition: profile fetches happen exclusively inside the handler, so they can never run in parallel.

```
onAuthStateChange handler:
  if session exists:
    fetch from users table: SELECT role WHERE user_id = session.user.id
    setUser(session.user)
    setProfile({ role })
    setLoading(false)
  if session is null (logout, expiry, etc.):
    setUser(null)
    setProfile(null)   ← explicit null to prevent stale role state
    setLoading(false)
```

`loading` remains `true` until the handler fires for the first time and both `user` and `profile` are set (or both are null). No component ever sees `loading: false` with a partially-resolved state.

### Cold start timeout

If `INITIAL_SESSION` never fires (misconfigured client, fully offline at cold start with no cached session), `loading` would stay `true` forever. A 10-second `setTimeout` registered in the same `useEffect` as the listener acts as a fallback: on expiry it sets `user: null`, `profile: null`, `loading: false`, showing the login screen instead of an infinite blank. The timeout is cancelled immediately when the `onAuthStateChange` handler fires normally.

### Profile fetch errors

If the `users` table query fails (network error, row not found, unknown role): set `user: null`, `profile: null`, `loading: false` immediately (so the UI unblocks), then call `supabase.auth.signOut()`. The subsequent `onAuthStateChange` null-session event will set the same null values a second time — this is redundant but harmless. **Do not remove the explicit null assignments** in the error handler: they are not replaceable by the `onAuthStateChange` re-entry because that re-entry is asynchronous. Log error to console in development.

### signOut

`signOut` calls `supabase.auth.signOut()`. The `onAuthStateChange` handler receives the resulting null session and explicitly sets `profile: null` and `user: null`, ensuring no stale role state persists after logout.

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
- Remove: own `loading` blank guard (lines 53-55) — `AuthLayout` owns the loading blank now

**OAuth callback handling:** The Supabase OAuth redirect URI must be configured to `<origin>/login` in the Supabase dashboard. `signInWithOAuth` calls pass `redirectTo: \`${window.location.origin}/login\`` explicitly — this ensures parity between local dev and production regardless of the Supabase dashboard Site URL setting. On redirect, Supabase JS picks up the token from the URL fragment automatically when the client initializes. `onAuthStateChange` fires with the new session, and `AuthLayout`'s redirect logic sends the authenticated user to their role's home. The existing `?error` param check in `LoginPage` covers the OAuth failure case.

### RegisterPage (`/register`)
- Fields: email, password, confirm password
- Zod schema: email valid, password min 6 chars, passwords match
- Calls `supabase.auth.signUp({ email, password })`
- **User row creation:** A Supabase database trigger on `auth.users` insert creates a row in the `users` table with the following fields populated from the new auth user:
  - `user_id` ← `NEW.id`
  - `email` ← `NEW.email`
  - `created_at` ← `NEW.created_at`
  - `role` ← `'client'` (default; admins can change directly in the database)
  No role selection field on the registration form.
- On success: Supabase sends a confirmation email → show "check your inbox" success state (no redirect)
- Link: "Already have an account? Sign in" → `/login`

### ForgotPasswordPage (`/forgot-password`)
- Field: email only
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/reset-password' })`
- On success: show "check your inbox" success state
- Link: "Back to sign in" → `/login`

### ResetPasswordPage (`/reset-password`)
- Fields: new password, confirm password
- On mount: check URL hash for `type=recovery` token as an early signal that a valid link was followed. If the hash is absent or malformed, immediately show "link inválido o expirado" with a link to `/forgot-password` — no spinner needed.
- If hash is present: show loading state and wait for `PASSWORD_RECOVERY`. The component subscribes directly to `supabase.auth.onAuthStateChange` inside a `useEffect` — this second subscriber runs alongside `AuthContext`'s subscriber (both fire on the same event; the context one sets `user`/`profile`, the component one enables the form). The subscription must be unsubscribed in the `useEffect` cleanup.
- **Timeout:** a 5-second `setTimeout` is set in the same `useEffect` as the subscription; the cleanup calls `clearTimeout` to prevent state updates on unmount. If `PASSWORD_RECOVERY` does not arrive within 5 seconds, show "link expirado" message with link to `/forgot-password`.
- On `PASSWORD_RECOVERY` received: cancel the timeout, enable the form. On submit: call `supabase.auth.updateUser({ password })`. On success: redirect to `/login`.

---

## 4. Layout Components

### AuthLayout
- Renders the split-panel shell (left: branding, right: `<Outlet />`)
- Guard condition: `!loading && user && profile` → redirect to role home:
  - `profile.role === 'profesional'` → `/profesional/dashboard`
  - `profile.role === 'client'` → `/client/dashboard`
- Shows blank screen while `loading` is true (prevents flash)
- Does not redirect if `user` is set but `profile` is null — this is the profile-fetch-error case handled in AuthContext by signing out

### ProfesionalLayout
- Shows blank screen while `loading` is true
- `!loading && !user` → redirect to `/login`
- `!loading && user && profile?.role !== 'profesional'` → redirect to `/client/dashboard`
  - Note: if `profile` is null after loading (error case), AuthContext has already signed the user out, so `!user` will be true and this branch redirects to `/login` instead
- Renders: minimal top bar (user email + sign-out button) + `<Outlet />`

### ClientLayout
- Mirror of `ProfesionalLayout` for `client` role
- Wrong role redirects to `/profesional/dashboard`

### RootRedirect (`/`)
- Inlined as a small component directly in `App.tsx` (no separate file — it is pure redirect logic with no UI)
- Shows blank screen while `loading` is true
- `!loading && !user` → `<Navigate to="/login" replace />`
- `!loading && profile?.role === 'profesional'` → `<Navigate to="/profesional/dashboard" replace />`
- `!loading && profile?.role === 'client'` → `<Navigate to="/client/dashboard" replace />`
- `!loading && user && !profile` → `<Navigate to="/login" replace />` (defensive fallback; AuthContext signs out on fetch failure, but this catches any delayed render)

---

## 5. Dashboard Placeholders

Both dashboards are minimal placeholders — a centered card showing the user's email and role. They will be replaced by full domain-specific UIs in future iterations.

- `ProfesionalDashboard`: "Bienvenido, [email]. Panel de profesional — en construcción."
- `ClientDashboard`: "Bienvenido, [email]. Panel de cliente — en construcción."

---

## 6. File Map

| File | Change |
|---|---|
| `src/contexts/AuthContext.tsx` | Remove `getSession()`; add `profile` state; drive all state from `onAuthStateChange`; profile fetch + null-on-logout |
| `src/App.tsx` | Full route config with React Router v7; inline `RootRedirect` component |
| `src/layouts/AuthLayout.tsx` | New — public split-panel shell; role-aware redirect |
| `src/layouts/ProfesionalLayout.tsx` | New — protected layout, role-gated |
| `src/layouts/ClientLayout.tsx` | New — protected layout, role-gated |
| `src/pages/LoginPage.tsx` | Remove own shell; add nav links; OAuth redirect URI documented |
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

## 9. Database Setup (Supabase)

### `users` table schema

```sql
create table public.users (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text not null,
  role     text not null default 'client' check (role in ('profesional', 'client')),
  created_at timestamptz not null default now()
);
```

### Trigger — auto-create user row on registration

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (user_id, email, created_at, role)
  values (NEW.id, NEW.email, NEW.created_at, 'client');
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

This trigger fires for every new signup (email/password and OAuth). No additional frontend code is needed to create the user row.

---

## 8. Error & Edge Cases

| Case | Handling |
|---|---|
| Profile fetch fails (network / row missing) | Sign out, redirect to `/login`, generic error shown |
| Unknown role value in DB | Treat as profile fetch failure — sign out, redirect to `/login` |
| `signOut` stale role state | `onAuthStateChange` null-session handler explicitly sets `profile: null` |
| OAuth callback error | Existing `?error` URL param check in `LoginPage` |
| OAuth callback success | `onAuthStateChange` fires; `AuthLayout` redirects to role home |
| Reset link absent/malformed on mount | URL hash check on mount → immediate "link inválido" state, no spinner |
| Reset link expired (`PASSWORD_RECOVERY` timeout) | 5-second timeout → "link expirado" + link to `/forgot-password` |
| Authenticated user visits `/login` | `AuthLayout` guard redirects to role home |
| Wrong-role user visits protected route | Layout guard redirects to correct role home |
| Null profile after loading (post-error) | AuthContext has signed out; layout guards see `!user` and redirect to `/login` |
