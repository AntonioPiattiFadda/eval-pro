import { useState, useCallback } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { signUp } from '@/service/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserRole } from '@/types/users.types'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const togglePassword = useCallback(() => setShowPassword(v => !v), [])
  const toggleConfirm = useCallback(() => setShowConfirm(v => !v), [])

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const signUpMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; role: UserRole }) => {
      return await signUp(credentials.email, credentials.password, credentials.role)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Cuenta creada exitosamente.')
      navigate('/')
    },
    onError: (err: Error) => {
      setErrors({ general: err.message || 'Error al crear la cuenta' })
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'El email es obligatorio'
    if (!formData.role) newErrors.role = 'Seleccioná un tipo de cuenta'
    if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    signUpMutation.mutate({
      email: formData.email,
      password: formData.password,
      role: formData.role as UserRole,
    })
  }

  const loading = signUpMutation.isPending
  const generalError = errors.general

  return (
    <>
      <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Crear cuenta</h2>
      <p className="text-on-surface-variant text-sm mb-6">Registrate para comenzar</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {generalError && (
          <div className="bg-error-container rounded-xl px-4 py-3">
            <p className="text-on-error-container text-sm">{generalError}</p>
          </div>
        )}

        {/* Role selector */}
        <div className="space-y-1.5">
          <Label className="text-on-surface-variant text-xs uppercase tracking-widest">Tipo de cuenta</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'PROFESSIONAL', label: 'Profesional' },
              { value: 'PATIENT', label: 'Paciente' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleInputChange('role', value)}
                className="h-10 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  background: formData.role === value ? 'var(--color-primary)' : 'transparent',
                  color: formData.role === value ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                  borderColor: formData.role === value ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.role && <p className="text-error text-xs">{errors.role}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-on-surface-variant text-xs uppercase tracking-widest">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 transition-colors"
            required
          />
          {errors.email && <p className="text-error text-xs">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-on-surface-variant text-xs uppercase tracking-widest">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="h-12 rounded-xl border-0 bg-surface-container-high text-on-surface placeholder:text-outline focus-visible:bg-surface-container-highest focus-visible:ring-0 transition-colors pr-12"
              required
            />
            <button type="button" onClick={togglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors" tabIndex={-1}>
              {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-error text-xs">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
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
              required
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
          className="w-full h-14 rounded-full border-0 text-sm font-bold uppercase tracking-widest text-on-primary flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-action) 100%)',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>

      <p className="text-center text-on-surface-variant text-xs uppercase tracking-widest mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
          Iniciá sesión
        </Link>
      </p>
    </>
  )
}
