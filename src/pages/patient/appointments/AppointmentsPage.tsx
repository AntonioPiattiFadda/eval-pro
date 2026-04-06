import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { usePatientId } from './hooks/usePatientId'
import { getAppointmentsForPatient, type PatientAppointment } from './services/appointments.service'

const STATUS_LABELS: Record<PatientAppointment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<PatientAppointment['status'], string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-destructive',
  COMPLETED: 'text-muted-foreground',
}

export function AppointmentsPage() {
  const { data: patientId, isLoading: patientIdLoading } = usePatientId()

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => getAppointmentsForPatient(patientId!),
    enabled: !!patientId,
  })

  const isLoading = patientIdLoading || appointmentsLoading

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-on-surface mb-6">Mis turnos</h1>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando turnos…</p>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No tenés turnos agendados
        </div>
      )}

      {!isLoading && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const start = new Date(appt.start_at)
            const end = new Date(appt.end_at)
            const dateStr = start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
            const startStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            const endStr = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={appt.appointment_id}
                className="flex items-start gap-4 px-4 py-4 rounded-xl bg-surface-container border border-outline-variant"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="capitalize">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {startStr} – {endStr}
                  </div>
                  {appt.professional && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      {appt.professional.user.full_name ?? 'Profesional sin nombre'}
                    </div>
                  )}
                  {appt.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {appt.location.name}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium shrink-0 ${STATUS_COLORS[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
