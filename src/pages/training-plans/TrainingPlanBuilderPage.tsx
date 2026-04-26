import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActiveToggle } from '@/components/ActiveToggle'
import { useTrainingPlanTree } from './hooks/useTrainingPlanTree'
import { useTogglePlanActive } from './hooks/useTogglePlanActive'
import { PlanTreeSidebar } from './components/builder/PlanTreeSidebar'
import { SessionExerciseEditor } from './components/plan/SessionExerciseEditor'

export function TrainingPlanBuilderPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const { data: plan, isLoading, isError } = useTrainingPlanTree(planId)
  const { mutate: togglePlanActive, isPending: isTogglingPlan } = useTogglePlanActive(planId!)

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-72 shrink-0 bg-surface-container-low h-full p-3 flex flex-col gap-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-7 rounded-lg" />
          <Skeleton className="h-7 rounded-lg" />
          <Skeleton className="h-7 rounded-lg mt-2" />
          <Skeleton className="h-7 rounded-lg" />
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="bg-surface-container-high rounded-xl p-6 flex flex-col items-center gap-3 max-w-sm text-center">
          <p className="font-medium text-on-surface">No se pudo cargar el plan</p>
          <p className="text-sm text-on-surface-variant">
            Verificá tu conexión o volvé al listado de planes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/professional/training-plans')}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Button>
        </div>
      </div>
    )
  }

  // Find the selected session across the tree
  const selectedSession = findSession(plan, selectedSessionId)

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <div className="w-72 shrink-0 bg-surface-container-low h-full overflow-y-auto border-r border-surface-container flex flex-col">
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 border-b border-surface-container shrink-0">
          <p className="text-sm font-medium text-on-surface truncate">{plan.name}</p>
          <ActiveToggle
            isActive={plan.is_active}
            isPending={isTogglingPlan}
            onToggle={() => togglePlanActive(!plan.is_active)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
        <PlanTreeSidebar
          plan={plan}
          planId={planId!}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedSession ? (
          <SessionExerciseEditor session={selectedSession} planId={planId!} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="rounded-full bg-surface-container-high p-5">
              <ArrowLeft className="w-6 h-6 text-on-surface-variant" />
            </div>
            <p className="font-medium text-on-surface">Seleccioná una sesión</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Elegí una sesión en el árbol de la izquierda para ver y editar sus ejercicios.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

import type { TrainingPlanTree, TrainingSessionWithExercises } from './types'

function findSession(
  plan: TrainingPlanTree,
  sessionId: string | null,
): TrainingSessionWithExercises | null {
  if (!sessionId) return null

  // Direct plan sessions
  const direct = plan.sessions.find((s) => s.session_id === sessionId)
  if (direct) return direct

  // Inside mesocycles
  for (const meso of plan.mesocycles) {
    const inMeso = meso.sessions.find((s) => s.session_id === sessionId)
    if (inMeso) return inMeso
    for (const micro of meso.microcycles) {
      const inMicro = micro.sessions.find((s) => s.session_id === sessionId)
      if (inMicro) return inMicro
    }
  }

  // Inside direct microcycles
  for (const micro of plan.microcycles) {
    const inMicro = micro.sessions.find((s) => s.session_id === sessionId)
    if (inMicro) return inMicro
  }

  return null
}
