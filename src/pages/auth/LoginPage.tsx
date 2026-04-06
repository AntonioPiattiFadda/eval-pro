import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signIn } from '@/service/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await signIn(credentials.email, credentials.password)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setError(null)
      window.location.href = '/'
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al iniciar sesión')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  const loading = loginMutation.isPending

  return (
    <>
      {/* Headline */}
      <div className="mb-7">
        <h2
          className="font-display font-bold text-on-surface leading-none uppercase mb-2"
          style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', letterSpacing: '-0.02em' }}
        >
          Bienvenido<br />de nuevo
        </h2>
        <p className="text-on-surface-variant text-sm">
          Ingresá tus credenciales para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-on-surface-variant text-xs uppercase tracking-widest"
          >
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 focus-visible:border-0 transition-colors"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-on-surface-variant text-xs uppercase tracking-widest"
            >
              Contraseña
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}
            >
              ¿Olvidaste?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 focus-visible:border-0 transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-container rounded-xl px-4 py-3">
            <p className="text-on-error-container text-sm">{error}</p>
          </div>
        )}

        {/* CTA button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-full border-0 text-sm font-bold uppercase tracking-widest text-on-primary flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-action) 100%)',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando…
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowForwardIcon />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-on-surface-variant text-xs uppercase tracking-widest whitespace-nowrap">
          O accedé vía
        </span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Social buttons — disabled, coming soon */}
      <div className="space-y-3">
        <Button
          type="button"
          disabled
          className="w-full h-12 rounded-xl border-0 bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-sm font-medium transition-colors"
        >
          <span className="flex items-center gap-3">
            <GoogleIcon />
            Continuar con Google
          </span>
        </Button>

        <Button
          type="button"
          disabled
          className="w-full h-12 rounded-xl border-0 bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-sm font-medium transition-colors"
        >
          <span className="flex items-center gap-3">
            <AppleIcon />
            Continuar con Apple
          </span>
        </Button>
      </div>

      {/* Register link */}
      <p className="text-center text-on-surface-variant text-xs uppercase tracking-widest mt-8">
        ¿Nuevo en EvalPro?{' '}
        <Link
          to="/register"
          className="font-semibold hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Creá una cuenta
        </Link>
      </p>
    </>
  )
}

function ArrowForwardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4v3z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.259 9.545c-.015-1.697.774-2.986 2.369-3.934-.895-1.276-2.24-1.981-3.999-2.12-1.659-.135-3.471 1.016-4.134 1.016-.694 0-2.289-.97-3.53-.97C2.445 3.567 0 5.534 0 9.568c0 1.211.222 2.462.665 3.753.594 1.7 2.735 5.864 4.967 5.795 1.156-.028 1.974-.793 3.498-.793 1.479 0 2.237.793 3.531.793 2.252-.032 4.194-3.861 4.77-5.564-3.031-1.44-3.172-4.007-3.172-4.007zM12.023 2.358C13.38.762 13.258-.001 13.258-.001c-1.474.088-3.197 1.026-4.188 2.271-.906 1.142-.851 2.437-.851 2.437 1.614.026 3.35-.971 3.804-2.349z" />
    </svg>
  )
}
