import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RegisterPatientForm } from '@/components/RegisterPatientForm'
import type { Patient } from '@/types/patients'

interface Props {
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (patient: Patient) => void
}

export function RegisterPatientDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <RegisterPatientForm
          organizationId={organizationId}
          onSuccess={(patient) => {
            onOpenChange(false)
            onSuccess(patient)
          }}
          onCancel={() => onOpenChange(false)}
          cancelLabel="Cancelar"
        />
      </DialogContent>
    </Dialog>
  )
}
