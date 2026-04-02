import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getPatientByEmail,
  createPatient,
  type Patient,
} from '../services/patients.service'

interface Props {
  onSelect: (patient: Patient) => void
  onBack: () => void
}

export function NewPatientSubStep({ onSelect, onBack }: Props) {
  const [step, setStep] = useState<'email' | 'create'>('email')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const handleEmailSearch = async () => {
    if (!email.trim()) return
    setLookingUp(true)
    setNotFound(false)
    setLookupError('')
    try {
      const existing = await getPatientByEmail(email)
      if (existing) {
        onSelect(existing)
      } else {
        setNotFound(true)
        setStep('create')
      }
    } catch (err) {
      setLookupError((err as Error).message)
    } finally {
      setLookingUp(false)
    }
  }

  const toastId = 'create-patient'
  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => createPatient({ full_name: fullName.trim(), email }),
    onMutate: () => { toast.loading('Creando paciente…', { id: toastId }) },
    onSuccess: (patient) => {
      toast.success('Paciente creado', { id: toastId })
      onSelect(patient)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  if (step === 'email') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver
        </button>
        <div className="space-y-1.5">
          <Label htmlFor="patient-email">Email del paciente</Label>
          <div className="flex gap-2">
            <Input
              id="patient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !lookingUp && handleEmailSearch()}
              placeholder="email@ejemplo.com"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={handleEmailSearch}
              disabled={lookingUp || !email.trim()}
            >
              {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
          {lookupError && (
            <p className="text-xs text-destructive">{lookupError}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => { setStep('email'); setNotFound(false) }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Volver
      </button>
      {notFound && (
        <p className="text-xs text-muted-foreground">
          No encontramos ningún paciente con ese email.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="patient-name">Nombre completo</Label>
        <Input
          id="patient-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          autoFocus
        />
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => create()}
        disabled={creating || !fullName.trim()}
      >
        {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
        Crear paciente
      </Button>
    </div>
  )
}
