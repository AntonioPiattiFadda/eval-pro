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
