import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession, getSessionsByPatient } from '@/service/sessions'
import { getPatient } from '@/service/patients.service'
import { PatientCard } from './components/PatientCard'
import { SessionHistory } from './components/SessionHistory'
import { WizardProgress } from './components/WizardProgress'
import { useProfessionalId } from '../agenda/hooks/useProfessionalId'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { data: professionalId } = useProfessionalId()

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (loadingSession) return
    if (session === null) {
      navigate('/professional/agenda', { replace: true })
      return
    }
    if (professionalId && session && session.professional_id !== professionalId) {
      navigate('/professional/agenda', { replace: true })
    }
  }, [session, loadingSession, professionalId, navigate])

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', session?.patient_id],
    queryFn: () => getPatient(session!.patient_id),
    enabled: !!session?.patient_id,
  })

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['session-history', session?.patient_id, sessionId],
    queryFn: () => getSessionsByPatient(session!.patient_id, sessionId!),
    enabled: !!session?.patient_id,
  })

  if (loadingSession || loadingPatient) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
  }

  if (!session || !patient) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WizardProgress currentStep={0} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/professional/agenda')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Sesión clínica
          </h2>
        </div>

        <PatientCard patient={patient} />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Sesiones anteriores</h3>
          {loadingHistory ? (
            <div className="text-xs text-muted-foreground">Cargando historial…</div>
          ) : (
            <SessionHistory sessions={history} />
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() =>
              navigate(`/professional/sessions/${sessionId}/anamnesis-fase1`)
            }
          >
            Iniciar evaluación
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
