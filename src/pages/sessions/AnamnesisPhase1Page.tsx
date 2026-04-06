import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getSession } from '@/service/sessions'
import { getPhase1Questions, getExistingPhase1Answers } from '@/service/anamnesis'
import { getDomains } from '@/service/domains'
import { getRegions } from '@/service/regions'
import { AnamnesisPhase1Form } from './components/AnamnesisPhase1Form'
import { WizardProgress } from './components/WizardProgress'

export function AnamnesisPhase1Page() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  })

  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['phase1-questions'],
    queryFn: getPhase1Questions,
    staleTime: Infinity,
  })

  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: ['domains'],
    queryFn: getDomains,
    staleTime: Infinity,
  })

  const { data: regions = [], isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
    staleTime: Infinity,
  })

  const { data: existingAnswers = {}, isLoading: loadingAnswers } = useQuery({
    queryKey: ['phase1-answers', sessionId],
    queryFn: () => getExistingPhase1Answers(sessionId!),
    enabled: !!sessionId,
  })

  const isLoading =
    loadingQuestions || loadingDomains || loadingRegions || loadingAnswers || !session

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WizardProgress currentStep={1} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(`/professional/sessions/${sessionId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Anamnesis — Fase 1
          </h2>
        </div>

        <AnamnesisPhase1Form
          sessionId={sessionId!}
          organizationId={profile?.organization_id ?? ''}
          questions={questions}
          domains={domains}
          regions={regions}
          initialRegionId={session.region_id}
          initialDomainId={session.domain_id}
          initialAnswers={existingAnswers}
        />
      </div>
    </div>
  )
}
