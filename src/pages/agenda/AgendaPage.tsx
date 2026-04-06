import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AgendaToolbar } from './AgendaToolbar'
import { AgendaDayNav } from './components/AgendaDayNav'
import { AgendaDayGrid } from './components/AgendaDayGrid'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import { AppointmentList } from './components/AppointmentList'
import { useProfessionalId } from './hooks/useProfessionalId'
import { useAuth } from '@/contexts/AuthContext'
import { createDraftSession, getSessionByAppointment } from '@/service/sessions'
import type { Appointment } from './services/appointments.service'

function parseDate(s: string | null): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function AgendaPage() {
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view') ?? 'mes'
  const date = parseDate(searchParams.get('date'))
  const { data: professionalId, isLoading } = useProfessionalId()
  const [slotDate, setSlotDate] = useState<Date | null>(null)
  const navigate = useNavigate()
  const { profile } = useAuth()

  const openSessionMutation = useMutation({
    mutationFn: async (appointment: Appointment) => {
      const existing = await getSessionByAppointment(appointment.appointment_id)
      if (existing) return existing
      return createDraftSession({
        patientId: appointment.patient_id!,
        professionalId: professionalId!,
        organizationId: profile?.organization_id ?? '',
        appointmentId: appointment.appointment_id,
      })
    },
    onMutate: () => toast.loading('Abriendo sesión…', { id: 'open-session' }),
    onSuccess: (session) => {
      toast.success('Sesión abierta', { id: 'open-session' })
      navigate(`/professional/sessions/${session.session_id}`)
    },
    onError: (err: Error) => toast.error(err.message, { id: 'open-session' }),
  })

  function handleAppointmentClick(appointment: Appointment) {
    if (!professionalId || !profile?.organization_id || !appointment.patient_id) return
    openSessionMutation.mutate(appointment)
  }

  if (view === 'dia') {
    return (
      <div className="flex flex-col h-full overflow-hidden min-h-0">
        <AgendaToolbar />
        <AgendaDayNav />
        {professionalId && (
          <>
            <AgendaDayGrid
              date={date}
              professionalId={professionalId}
              onSlotClick={setSlotDate}
              onAppointmentClick={handleAppointmentClick}
            />
            {slotDate !== null && (
              <NewAppointmentDialog
                key={slotDate.toISOString()}
                professionalId={professionalId}
                defaultDate={slotDate}
                open={true}
                onOpenChange={(v) => { if (!v) setSlotDate(null) }}
              />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AgendaToolbar />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Agenda</h2>
          {professionalId && (
            <NewAppointmentDialog professionalId={professionalId} />
          )}
        </div>

        {isLoading && (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        )}

        {!isLoading && !professionalId && (
          <div className="text-sm text-muted-foreground">
            No se encontró un perfil profesional para este usuario.
          </div>
        )}

        {professionalId && (
          <AppointmentList
            professionalId={professionalId}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>
    </div>
  )
}
