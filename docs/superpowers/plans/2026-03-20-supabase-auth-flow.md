# Supabase Auth Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete Supabase auth flow with role-based routing (`profesional` / `client`) using React Router v7 nested layouts.

**Architecture:** `AuthContext` drives all auth state exclusively from `onAuthStateChange` (session + profile from `users.role`). Three layout components (`AuthLayout`, `ProfesionalLayout`, `ClientLayout`) guard routes declaratively via `<Navigate>`. Auth pages (login, register, forgot-password, reset-password) share a split-panel shell from `AuthLayout`.

**Tech Stack:** React 19, TypeScript, Vite, react-router-dom v7, @supabase/supabase-js v2, react-hook-form, Zod, shadcn/ui (Button, Input, Label), Tailwind CSS v4.

> **Note:** No test runner is configured in this project. Each task includes manual browser verification steps instead of automated tests.

---

## File Map

| File | Action |
|---|---|
| `src/contexts/AuthContext.tsx` | Modify — add `profile`, remove `getSession()`, cold start timeout, profile fetch |
| `src/App.tsx` | Rewrite — React Router v7 route config + inline `RootRedirect` |
| `src/layouts/AuthLayout.tsx` | Create — public split-panel shell, role-aware redirect |
| `src/layouts/ProfesionalLayout.tsx` | Create — protected layout, role guard |
| `src/layouts/ClientLayout.tsx` | Create — protected layout, role guard |
| `src/pages/LoginPage.tsx` | Modify — remove own shell + loading guard, add nav links, update OAuth redirectTo |
| `src/pages/RegisterPage.tsx` | Create — email/password/confirm, signUp, success state |
| `src/pages/ForgotPasswordPage.tsx` | Create — email, resetPasswordForEmail, success state |
| `src/pages/ResetPasswordPage.tsx` | Create — hash check, PASSWORD_RECOVERY subscription, 5s timeout, form |
| `src/pages/ProfesionalDashboard.tsx` | Create — placeholder card |
| `src/pages/ClientDashboard.tsx` | Create — placeholder card |

---

## Task 1: Install react-router-dom

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
npm install react-router-dom
```

Expected output: `added N packages` with no errors. `react-router-dom` appears in `package.json` dependencies.

- [ ] **Step 2: Verify TypeScript types are bundled**

`react-router-dom` v7 ships its own types — no `@types/react-router-dom` needed. Confirm by checking:

```bash
ls node_modules/react-router-dom/dist/*.d.ts
```

Expected: at least one `.d.ts` file listed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-router-dom v7"
```

---

## Task 2: Refactor AuthContext

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

Replace the existing `AuthContext` entirely. Key changes:
- Add `Profile` interface and `profile` state
- Remove `getSession()` — all state driven from `onAuthStateChange`
- Add 10-second cold start timeout (cancelled when handler fires)
- Profile fetch from `users` table on session present
- Explicit `null` on logout and profile error
- Update `signInWithOAuth` calls to pass `redirectTo`

- [ ] **Step 1: Replace AuthContext**

Write `src/contexts/AuthContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  role: 'profesional' | 'client'
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<AuthError | null>
  signInWithGoogle: () => Promise<AuthError | null>
  signInWithApple: () => Promise<AuthError | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cold start timeout: if INITIAL_SESSION never fires (offline, misconfigured client),
    // unblock the UI after 10s showing the login screen instead of a permanent blank.
    const timeout = setTimeout(() => {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }, 10000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(timeout)

      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (error || !data || !['profesional', 'client'].includes(data.role)) {
          // Profile fetch failed or unknown role — unblock UI immediately, then sign out.
          // Do NOT rely on the subsequent onAuthStateChange null-session to clear state:
          // that re-entry is asynchronous and the UI must unblock now.
          console.error('[AuthContext] Profile fetch failed:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          await supabase.auth.signOut()
          return
        }

        setUser(session.user)
        setProfile({ role: data.role as 'profesional' | 'client' })
        setLoading(false)
      } else {
        // Covers: logout, session expiry, signOut call, cold start with no session.
        // Explicit null assignment prevents stale role state after logout.
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signInWithGoogle(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    })
    return error
  }

  async function signInWithApple(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/login` },
    })
    return error
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    // onAuthStateChange null-session handler sets user/profile to null
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: no TypeScript errors related to `AuthContext`. (Build may fail on missing route imports — that's fine, fix in later tasks.)

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: refactor AuthContext with profile, onAuthStateChange-only, cold start timeout"
```

---

## Task 3: Create AuthLayout

**Files:**
- Create: `src/layouts/AuthLayout.tsx`

Extracts the split-panel shell from `LoginPage` and adds role-aware redirect for authenticated users.

- [ ] **Step 1: Create the layout**

Write `src/layouts/AuthLayout.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthLayout() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />

  if (user && profile) {
    return (
      <Navigate
        to={profile.role === 'profesional' ? '/profesional/dashboard' : '/client/dashboard'}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel — branding (desktop only) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-surface-container-low">
        <span className="text-primary font-display font-semibold text-2xl tracking-tight">
          EvalPro
        </span>
        <div>
          <h1 className="font-display text-5xl font-bold text-on-surface leading-tight mb-4">
            Evaluación clínica<br />de alto rendimiento
          </h1>
          <p className="text-on-surface-variant text-lg">
            Kinesiología · Nutrición · Psicología · Entrenamiento
          </p>
        </div>
        <span className="text-on-surface-variant text-sm">© 2026 EvalPro</span>
      </div>

      {/* Right panel — page content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-16">

        {/* Mobile logo */}
        <div className="md:hidden mb-10 text-center">
          <span className="text-primary font-display font-semibold text-3xl tracking-tight">
            EvalPro
          </span>
          <p className="text-on-surface-variant text-sm mt-2">Evaluación clínica profesional</p>
        </div>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/AuthLayout.tsx
git commit -m "feat: add AuthLayout with split-panel shell and role-aware redirect"
```

---

## Task 4: Create ProfesionalLayout and ClientLayout

**Files:**
- Create: `src/layouts/ProfesionalLayout.tsx`
- Create: `src/layouts/ClientLayout.tsx`

Both layouts show a minimal top bar and guard by role. Wrong-role users are redirected to their correct home.

- [ ] **Step 1: Create ProfesionalLayout**

Write `src/layouts/ProfesionalLayout.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProfesionalLayout() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'profesional') return <Navigate to="/client/dashboard" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low">
        <span className="text-primary font-display font-semibold text-lg tracking-tight">EvalPro</span>
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant text-sm">{user.email}</span>
          <button
            onClick={signOut}
            className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create ClientLayout**

Write `src/layouts/ClientLayout.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ClientLayout() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'client') return <Navigate to="/profesional/dashboard" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low">
        <span className="text-primary font-display font-semibold text-lg tracking-tight">EvalPro</span>
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant text-sm">{user.email}</span>
          <button
            onClick={signOut}
            className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/ProfesionalLayout.tsx src/layouts/ClientLayout.tsx
git commit -m "feat: add ProfesionalLayout and ClientLayout with role guards"
```

---

## Task 5: Create dashboard placeholders

**Files:**
- Create: `src/pages/ProfesionalDashboard.tsx`
- Create: `src/pages/ClientDashboard.tsx`

Minimal placeholder cards — will be replaced in future iterations.

- [ ] **Step 1: Create ProfesionalDashboard**

Write `src/pages/ProfesionalDashboard.tsx`:

```tsx
import { useAuth } from '../contexts/AuthContext'

export function ProfesionalDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Panel de profesional</h2>
        <p className="text-on-surface-variant text-sm">{user?.email}</p>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ClientDashboard**

Write `src/pages/ClientDashboard.tsx`:

```tsx
import { useAuth } from '../contexts/AuthContext'

export function ClientDashboard() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Panel de cliente</h2>
        <p className="text-on-surface-variant text-sm">{user?.email}</p>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfesionalDashboard.tsx src/pages/ClientDashboard.tsx
git commit -m "feat: add dashboard placeholder pages"
```

---

## Task 6: Wire up App.tsx with full route config

**Files:**
- Rewrite: `src/App.tsx`

Replaces the current `<LoginPage />` stub with the full React Router v7 route tree and inline `RootRedirect`.

- [ ] **Step 1: Rewrite App.tsx**

Write `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { ProfesionalLayout } from './layouts/ProfesionalLayout'
import { ClientLayout } from './layouts/ClientLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ProfesionalDashboard } from './pages/ProfesionalDashboard'
import { ClientDashboard } from './pages/ClientDashboard'
import { useAuth } from './contexts/AuthContext'

function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'profesional') return <Navigate to="/profesional/dashboard" replace />
  if (profile?.role === 'client') return <Navigate to="/client/dashboard" replace />
  // Defensive fallback: user exists but profile is null — AuthContext is signing out
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<ProfesionalLayout />}>
          <Route path="/profesional/dashboard" element={<ProfesionalDashboard />} />
        </Route>
        <Route element={<ClientLayout />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Verify build compiles**

At this point `RegisterPage`, `ForgotPasswordPage`, and `ResetPasswordPage` don't exist yet — the build will fail. That's expected. Confirm the error is only about missing page imports:

```bash
npm run build 2>&1 | grep "error"
```

Expected: errors about `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` not found — nothing else.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up React Router v7 route tree with layout guards"
```

---

## Task 7: Update LoginPage

**Files:**
- Modify: `src/pages/LoginPage.tsx`

Three changes: (1) remove the split-panel shell — `AuthLayout` owns it now; (2) remove the `loading` blank guard — `AuthLayout` owns it; (3) add "Forgot password?" and "Register" links.

- [ ] **Step 1: Rewrite LoginPage**

Write `src/pages/LoginPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AuthError } from '@supabase/supabase-js'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

function mapAuthError(error: AuthError | null, isOAuthCallback = false): string | null {
  if (!error && !isOAuthCallback) return null
  if (isOAuthCallback) return 'Error al autenticar con proveedor externo'
  const code = (error?.code ?? error?.message ?? '').toLowerCase()
  if (code.includes('invalid_credentials') || code.includes('invalid login')) return 'Email o contraseña incorrectos'
  if (code.includes('email_not_confirmed')) return 'Confirmá tu email antes de ingresar'
  if (code.includes('too_many_requests') || code.includes('rate_limit')) return 'Demasiados intentos. Esperá unos minutos'
  if (code.includes('fetch') || code.includes('network')) return 'Sin conexión. Verificá tu internet'
  if (code.includes('provider') || code.includes('oauth')) return 'No se pudo conectar con el proveedor. Intentá de nuevo'
  return 'Ocurrió un error. Intentá de nuevo'
}

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
})
type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setAuthError(mapAuthError(null, true))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function onSubmit(data: LoginFormData) {
    setAuthError(null)
    const error = await signInWithEmail(data.email, data.password)
    if (error) setAuthError(mapAuthError(error))
  }

  async function handleGoogle() {
    setSocialLoading('google')
    setAuthError(null)
    const error = await signInWithGoogle()
    if (error) {
      setAuthError(mapAuthError(error))
      setSocialLoading(null)
    }
  }

  async function handleApple() {
    setSocialLoading('apple')
    setAuthError(null)
    const error = await signInWithApple()
    if (error) {
      setAuthError(mapAuthError(error))
      setSocialLoading(null)
    }
  }

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">
        Iniciar sesión
      </h2>
      <p className="text-on-surface-variant text-sm mb-8">
        Ingresá a tu cuenta para continuar
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-on-surface-variant text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            {...register('email')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.email && (
            <p className="text-error text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-on-surface-variant text-sm">Contraseña</Label>
            <Link to="/forgot-password" className="text-primary text-xs hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.password && (
            <p className="text-error text-xs">{errors.password.message}</p>
          )}
        </div>

        {authError && (
          <div className="bg-error-container rounded-lg px-4 py-3">
            <p className="text-on-error-container text-sm">{authError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold"
        >
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-on-surface-variant text-xs uppercase tracking-widest">o</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={socialLoading !== null}
          className="w-full border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high"
        >
          {socialLoading === 'google' ? 'Redirigiendo…' : (
            <span className="flex items-center gap-2">
              <GoogleIcon />
              Continuar con Google
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleApple}
          disabled={socialLoading !== null}
          className="w-full border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high"
        >
          {socialLoading === 'apple' ? 'Redirigiendo…' : (
            <span className="flex items-center gap-2">
              <AppleIcon />
              Continuar con Apple
            </span>
          )}
        </Button>
      </div>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Registrate
        </Link>
      </p>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.259 9.545c-.015-1.697.774-2.986 2.369-3.934-.895-1.276-2.24-1.981-3.999-2.12-1.659-.135-3.471 1.016-4.134 1.016-.694 0-2.289-.97-3.53-.97C2.445 3.567 0 5.534 0 9.568c0 1.211.222 2.462.665 3.753.594 1.7 2.735 5.864 4.967 5.795 1.156-.028 1.974-.793 3.498-.793 1.479 0 2.237.793 3.531.793 2.252-.032 4.194-3.861 4.77-5.564-3.031-1.44-3.172-4.007-3.172-4.007zM12.023 2.358C13.38.762 13.258-.001 13.258-.001c-1.474.088-3.197 1.026-4.188 2.271-.906 1.142-.851 2.437-.851 2.437 1.614.026 3.35-.971 3.804-2.349z"/>
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: update LoginPage — remove own shell, add nav links"
```

---

## Task 8: Create RegisterPage

**Files:**
- Create: `src/pages/RegisterPage.tsx`

Email + password + confirm password form. On success shows "check your inbox" state. The DB trigger creates the `users` row automatically.

- [ ] **Step 1: Create RegisterPage**

Write `src/pages/RegisterPage.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const registerSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterFormData) {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      const code = (error.code ?? error.message ?? '').toLowerCase()
      if (code.includes('already')) setAuthError('Ya existe una cuenta con ese email')
      else setAuthError('Ocurrió un error. Intentá de nuevo')
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Revisá tu email</h2>
        <p className="text-on-surface-variant text-sm">
          Te enviamos un enlace de confirmación. Hacé clic en él para activar tu cuenta.
        </p>
        <Link to="/login" className="text-primary hover:underline text-sm block">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Crear cuenta</h2>
      <p className="text-on-surface-variant text-sm mb-8">Registrate para comenzar</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-on-surface-variant text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            {...register('email')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.email && <p className="text-error text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-on-surface-variant text-sm">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('password')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-on-surface-variant text-sm">Confirmá tu contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.confirmPassword && <p className="text-error text-xs">{errors.confirmPassword.message}</p>}
        </div>

        {authError && (
          <div className="bg-error-container rounded-lg px-4 py-3">
            <p className="text-on-error-container text-sm">{authError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold"
        >
          {isSubmitting ? 'Registrando…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Iniciá sesión
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/RegisterPage.tsx
git commit -m "feat: add RegisterPage with email/password signup and success state"
```

---

## Task 9: Create ForgotPasswordPage

**Files:**
- Create: `src/pages/ForgotPasswordPage.tsx`

Single email field. Calls `resetPasswordForEmail` with `redirectTo` pointing to `/reset-password`. On success shows "check your inbox" state.

- [ ] **Step 1: Create ForgotPasswordPage**

Write `src/pages/ForgotPasswordPage.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const schema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setAuthError('Ocurrió un error. Intentá de nuevo')
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Revisá tu email</h2>
        <p className="text-on-surface-variant text-sm">
          Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-primary hover:underline text-sm block">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Recuperar contraseña</h2>
      <p className="text-on-surface-variant text-sm mb-8">
        Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-on-surface-variant text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            {...register('email')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.email && <p className="text-error text-xs">{errors.email.message}</p>}
        </div>

        {authError && (
          <div className="bg-error-container rounded-lg px-4 py-3">
            <p className="text-on-error-container text-sm">{authError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold"
        >
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        <Link to="/login" className="text-primary hover:underline font-medium">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ForgotPasswordPage.tsx
git commit -m "feat: add ForgotPasswordPage with resetPasswordForEmail"
```

---

## Task 10: Create ResetPasswordPage

**Files:**
- Create: `src/pages/ResetPasswordPage.tsx`

Most complex auth page. Three rendering states: `checking` (loading), `invalid` (bad/expired link), `ready` (form enabled), `success` (updated). Subscribes directly to `supabase.auth.onAuthStateChange` for `PASSWORD_RECOVERY` event with a 5-second timeout.

- [ ] **Step 1: Create ResetPasswordPage**

Write `src/pages/ResetPasswordPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

type PageState = 'checking' | 'invalid' | 'ready' | 'success'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>('checking')
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    // Early signal: if the URL hash has no type=recovery, show invalid immediately.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('type') !== 'recovery') {
      setState('invalid')
      return
    }

    // Subscribe directly to supabase auth events — AuthContext's subscriber also fires
    // on PASSWORD_RECOVERY (it sets user/profile); this one enables the form.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timeout)
        setState('ready')
      }
    })

    // 5-second timeout: if PASSWORD_RECOVERY never arrives, show expired state.
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      setState('invalid')
    }, 5000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setAuthError('Ocurrió un error. Intentá de nuevo')
      return
    }
    setState('success')
    setTimeout(() => navigate('/login'), 2000)
  }

  if (state === 'checking') {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Verificando enlace…</p>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Enlace inválido o expirado</h2>
        <p className="text-on-surface-variant text-sm">
          El enlace de restablecimiento no es válido o ya expiró.
        </p>
        <Link to="/forgot-password" className="text-primary hover:underline text-sm block">
          Solicitar un nuevo enlace
        </Link>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Contraseña actualizada</h2>
        <p className="text-on-surface-variant text-sm">Redirigiendo al inicio de sesión…</p>
      </div>
    )
  }

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Nueva contraseña</h2>
      <p className="text-on-surface-variant text-sm mb-8">Ingresá tu nueva contraseña.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-on-surface-variant text-sm">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('password')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-on-surface-variant text-sm">Confirmá tu contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
          />
          {errors.confirmPassword && <p className="text-error text-xs">{errors.confirmPassword.message}</p>}
        </div>

        {authError && (
          <div className="bg-error-container rounded-lg px-4 py-3">
            <p className="text-on-error-container text-sm">{authError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold"
        >
          {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
        </Button>
      </form>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ResetPasswordPage.tsx
git commit -m "feat: add ResetPasswordPage with PASSWORD_RECOVERY subscription and 5s timeout"
```

---

## Task 11: Final build verification and smoke test

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors, no import errors.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173` (or similar).

- [ ] **Step 3: Manual smoke tests**

Open browser and verify each scenario:

| Scenario | Steps | Expected |
|---|---|---|
| Unauthenticated root | Visit `/` | Redirects to `/login` |
| Unauthenticated protected route | Visit `/profesional/dashboard` | Redirects to `/login` |
| Login page renders | Visit `/login` | Split-panel with form, "Registrate" link, "¿Olvidaste tu contraseña?" link |
| Register page renders | Visit `/register` | Form with email + password + confirm, "Iniciá sesión" link |
| Forgot password renders | Visit `/forgot-password` | Email form, "Volver al inicio" link |
| Reset password (no hash) | Visit `/reset-password` | "Enlace inválido o expirado" state immediately |
| Logged-in user visits `/login` | Sign in, then navigate to `/login` | Redirects to role dashboard |
| Sign out | Click "Cerrar sesión" | Redirects to `/login` |

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Expected: no errors. Fix any warnings about unused imports if present.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Supabase auth flow with role-based routing"
```

---

## Database Setup (run once in Supabase SQL editor)

Before testing the full flow end-to-end, run the following in the Supabase SQL editor:

```sql
-- 1. Create the users table
create table public.users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'client' check (role in ('profesional', 'client')),
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (restrict direct access)
alter table public.users enable row level security;

-- 3. Allow users to read their own row (needed for AuthContext profile fetch)
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = user_id);

-- 4. Trigger function: auto-insert on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (user_id, email, created_at, role)
  values (NEW.id, NEW.email, NEW.created_at, 'client');
  return NEW;
end;
$$;

-- 5. Attach trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

> **Important:** The RLS policy is required — without it, the `select('role').eq('user_id', ...)` query in `AuthContext` will return no rows, causing a profile fetch failure for every user.
