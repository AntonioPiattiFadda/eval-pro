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
    // Early signal: if URL hash has no type=recovery, show invalid immediately — no spinner needed.
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
    // clearTimeout in cleanup prevents state updates on unmount.
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
