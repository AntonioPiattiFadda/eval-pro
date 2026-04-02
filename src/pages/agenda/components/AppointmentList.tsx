import { useQuery } from '@tanstack/react-query'
import { Clock, User } from 'lucide-react'
import { getAppointmentsForProfessional, type Appointment } from '../services/appointments.service'

const STATUS_LABELS: Record<Appointment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<Appointment['status'], string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-destructive',
  COMPLETED: 'text-muted-foreground',
}

interface Props {
  professionalId: string
}

export function AppointmentList({ professionalId }: Props) {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', professionalId],
    queryFn: () => getAppointmentsForProfessional(professionalId),
    enabled: !!professionalId,
  })

  if (isLoading) {
    return <div className="text-xs text-muted-foreground px-1">Cargando turnos…</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hay turnos agendados
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => {
        const start = new Date(appt.start_at)
        const end = new Date(appt.end_at)
        const dateStr = start.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
        const startStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        const endStr = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

        return (
          <div
            key={appt.appointment_id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{appt.patient?.full_name ?? 'Paciente sin nombre'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {dateStr} · {startStr} – {endStr}
              </div>
            </div>
            <span className={`text-xs font-medium ${STATUS_COLORS[appt.status]}`}>
              {STATUS_LABELS[appt.status]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
