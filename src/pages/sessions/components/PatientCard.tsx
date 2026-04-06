import { User, Mail, CreditCard } from 'lucide-react'
import type { PatientInfo } from '@/types/patient.types'

interface Props {
  patient: PatientInfo
}

export function PatientCard({ patient }: Props) {
  const { user } = patient
  return (
    <div className="rounded-xl bg-surface-container border border-outline-variant p-4 space-y-2">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">
          {user?.full_name ?? 'Sin nombre'}
        </span>
      </div>
      {user?.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span>{user.email}</span>
        </div>
      )}
      {user?.identification_number && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          <span>DNI {user.identification_number}</span>
        </div>
      )}
    </div>
  )
}
