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
