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
