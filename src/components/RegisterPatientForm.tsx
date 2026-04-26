import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { invitePatient } from '@/service/patients.service'
import type { Patient } from '@/types/patients'

interface Props {
  organizationId: string
  onSuccess: (patient: Patient) => void
  onCancel: () => void
  /** Label for the cancel action. Defaults to "Volver a buscar" */
  cancelLabel?: string
}

export function RegisterPatientForm({
  organizationId,
  onSuccess,
  onCancel,
  cancelLabel = 'Volver a buscar',
}: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [identificationNumber, setIdentificationNumber] = useState('')

  const toastId = 'invite-patient'
  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: () =>
      invitePatient({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        identification_number: identificationNumber.trim() || undefined,
        organization_id: organizationId,
      }),
    onMutate: () => { toast.loading('Registrando paciente…', { id: toastId }) },
    onSuccess: (patient) => {
      toast.success('Paciente registrado. Se envió el email de activación.', { id: toastId })
      onSuccess(patient)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {cancelLabel}
      </button>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          autoFocus={!email}
        />
        <p className="text-xs text-muted-foreground">
          El paciente recibirá un email para activar su cuenta y acceder a su historia clínica.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Nombre completo</Label>
        <Input
          id="reg-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          autoFocus={!!email}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-dni">
          DNI / N° identificación
          <span className="text-muted-foreground ml-1 font-normal">(opcional)</span>
        </Label>
        <Input
          id="reg-dni"
          value={identificationNumber}
          onChange={(e) => setIdentificationNumber(e.target.value)}
          placeholder="12345678"
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => invite()}
        disabled={inviting || !email.trim() || !fullName.trim()}
      >
        {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
        Registrar paciente
      </Button>
    </div>
  )
}
