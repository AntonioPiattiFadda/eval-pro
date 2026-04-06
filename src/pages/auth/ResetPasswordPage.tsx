import { useState, useCallback, useEffect } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const togglePassword = useCallback(() => setShowPassword(v => !v), [])
  const toggleConfirm = useCallback(() => setShowConfirm(v => !v), [])

  useEffect(() => {
    async function establishSession() {
      // Check if a session already exists (e.g. user navigated back)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setVerifying(false)
        return
      }

      // Read token params from URL — Supabase v2 invite/recovery links use token_hash
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type') as 'invite' | 'recovery' | null

      if (!tokenHash || !type) {
        setTokenError('El enlace no es válido. Solicitá uno nuevo.')
        setVerifying(false)
        return
      }

      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) {
        setTokenError('El enlace expiró o ya fue usado. Solicitá uno nuevo.')
        setVerifying(false)
        return
      }

      setVerifying(false)
    }

    establishSession()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: formData.password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/'), 2000)
  }

  if (verifying) {
    return (
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        <p className="text-on-surface-variant text-sm">Verificando enlace…</p>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Enlace inválido</h2>
        <p className="text-on-surface-variant text-sm">{tokenError}</p>
        <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
          ← Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Contraseña actualizada</h2>
        <p className="text-on-surface-variant text-sm">Redirigiendo…</p>
      </div>
    )
  }

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Nueva contraseña</h2>
      <p className="text-on-surface-variant text-sm mb-8">Ingresá tu nueva contraseña.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-on-surface-variant text-xs uppercase tracking-widest">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 transition-colors pr-12"
            />
            <button type="button" onClick={togglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors" tabIndex={-1}>
              {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-error text-xs">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-on-surface-variant text-xs uppercase tracking-widest">Confirmá tu contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 transition-colors pr-12"
            />
            <button type="button" onClick={toggleConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors" tabIndex={-1}>
              {!showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-error text-xs">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-action hover:opacity-90 text-on-primary font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando…
            </>
          ) : (
            'Actualizar contraseña'
          )}
        </Button>

        <p className="text-center text-on-surface-variant text-sm">
          <Link to="/login" className="hover:underline font-medium" style={{ color: 'var(--color-primary)' }}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </>
  )
}
