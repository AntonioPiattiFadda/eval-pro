import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      toast.error('Error al enviar el correo')
      setLoading(false)
      return
    }

    toast.success('Correo enviado exitosamente')
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Revisá tu email</h2>
        <p className="text-on-surface-variant text-sm">
          Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link to="/login" className="hover:underline text-sm block" style={{ color: 'var(--color-primary)' }}>
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-on-surface-variant text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface-container-lowest border-outline-variant text-on-surface placeholder:text-on-surface-variant"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            'Enviar enlace'
          )}
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-sm mt-6">
        <Link to="/login" className="hover:underline font-medium" style={{ color: 'var(--color-primary)' }}>
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
