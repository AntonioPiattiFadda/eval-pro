import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrainingPlanTree } from '@/pages/training-plans/hooks/useTrainingPlanTree'
import type {
  TrainingPlanTree,
  TrainingMesocycleWithSessions,
  TrainingMicrocycleWithSessions,
  TrainingSessionWithExercises,
  TrainingSessionExerciseWithName,
} from '@/pages/training-plans/types'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrescription(ex: TrainingSessionExerciseWithName): string {
  const parts: string[] = []

  const volume =
    ex.reps != null && ex.set_duration_seconds != null
      ? `${ex.sets} × ${ex.reps} reps × ${ex.set_duration_seconds}s`
      : ex.reps != null
        ? `${ex.sets} × ${ex.reps} reps`
        : ex.set_duration_seconds != null
          ? `${ex.sets} × ${ex.set_duration_seconds}s`
          : `${ex.sets} series`
  parts.push(volume)

  if (ex.load_unit !== 'NONE' && ex.load_value != null) {
    const unit =
      ex.load_unit === 'KG' ? 'kg'
      : ex.load_unit === 'PERCENTAGE_1RM' ? '% 1RM'
      : ex.load_unit === 'RPE' ? 'RPE'
      : ex.load_unit === 'PERCENTAGE_VELOCITY' ? '% vel.'
      : ''
    parts.push(`${ex.load_value}${unit}`)
  }

  if (ex.rest_seconds != null) {
    parts.push(`${ex.rest_seconds}s descanso`)
  }

  return parts.join(' · ')
}

// ─── Exercise row ─────────────────────────────────────────────────────────────

function ExerciseRow({ ex, bordered = true }: { ex: TrainingSessionExerciseWithName; bordered?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-0.5 py-2', bordered && 'border-b border-surface-container last:border-0')}>
      <span className="text-sm text-on-surface font-medium">{ex.exercise_name}</span>
      <span className="text-xs text-on-surface-variant">{formatPrescription(ex)}</span>
      {ex.notes && (
        <span className="text-xs text-on-surface-variant italic">{ex.notes}</span>
      )}
    </div>
  )
}

// ─── Group types ──────────────────────────────────────────────────────────────

type ExGroup =
  | { type: 'single'; exercise: TrainingSessionExerciseWithName }
  | { type: 'group'; label: string; exercises: TrainingSessionExerciseWithName[] }

function groupExercises(exercises: TrainingSessionExerciseWithName[]): ExGroup[] {
  const result: ExGroup[] = []
  const seen = new Map<string, TrainingSessionExerciseWithName[]>()
  for (const ex of exercises) {
    if (!ex.group_label) {
      result.push({ type: 'single', exercise: ex })
    } else {
      const existing = seen.get(ex.group_label)
      if (existing) {
        existing.push(ex)
      } else {
        const list = [ex]
        seen.set(ex.group_label, list)
        result.push({ type: 'group', label: ex.group_label, exercises: list })
      }
    }
  }
  return result
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: TrainingSessionWithExercises }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl lg:rounded-xl bg-surface-container overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-4 lg:py-3 text-left active:bg-surface-container-high hover:bg-surface-container-high transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
          : <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-on-surface">{session.name}</span>
        {session.day_of_week && session.day_of_week.length > 0 && (
          <span className="text-xs text-on-surface-variant shrink-0">
            {session.day_of_week.map((d) => DAY_LABELS[d]).join(' · ')}
          </span>
        )}
        {!open && (
          <span className="text-xs text-on-surface-variant shrink-0">
            {session.exercises.length} ej.
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {session.exercises.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-1">Sin ejercicios asignados</p>
          ) : (
            groupExercises(session.exercises).map((group) => {
              if (group.type === 'single') {
                return <ExerciseRow key={group.exercise.session_exercise_id} ex={group.exercise} />
              }
              return (
                <div key={`group-${group.label}`} className="rounded-xl border border-outline-variant overflow-hidden">
                  <div className="px-3 py-2 bg-primary/5 border-b border-outline-variant flex items-center gap-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {group.label}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {group.exercises.length} ej. · en bloque
                    </span>
                  </div>
                  <div className="px-3">
                    {group.exercises.map((ex) => (
                      <ExerciseRow key={ex.session_exercise_id} ex={ex} bordered />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Microcycle block ─────────────────────────────────────────────────────────

function MicrocycleBlock({ micro }: { micro: TrainingMicrocycleWithSessions }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {micro.name}
        </h4>
        <span className="text-xs text-on-surface-variant/60">
          {micro.repeat_count}×{micro.duration_days}d
        </span>
      </div>
      <div className="flex flex-col gap-2 pl-3 border-l-2 border-outline-variant">
        {micro.sessions.map((s) => (
          <SessionCard key={s.session_id} session={s} />
        ))}
        {micro.sessions.length === 0 && (
          <p className="text-xs text-on-surface-variant py-1">Sin sesiones</p>
        )}
      </div>
    </div>
  )
}

// ─── Mesocycle block ──────────────────────────────────────────────────────────

function MesocycleBlock({ meso }: { meso: TrainingMesocycleWithSessions }) {
  const [open, setOpen] = useState(true)
  const totalSessions =
    meso.sessions.length + meso.microcycles.reduce((acc, m) => acc + m.sessions.length, 0)

  return (
    <div className="rounded-2xl lg:rounded-xl bg-surface-container-low overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-4 lg:py-3 text-left active:bg-surface-container hover:bg-surface-container transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
          : <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />}
        <span className="flex-1 text-base font-semibold text-on-surface">{meso.name}</span>
        {!open && (
          <span className="text-xs text-on-surface-variant shrink-0">
            {totalSessions} sesión{totalSessions !== 1 ? 'es' : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {meso.microcycles.map((micro) => (
            <MicrocycleBlock key={micro.microcycle_id} micro={micro} />
          ))}

          {meso.sessions.length > 0 && (
            <div className="flex flex-col gap-2">
              {meso.microcycles.length > 0 && (
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1">
                  Sesiones aisladas
                </p>
              )}
              {meso.sessions.map((s) => (
                <SessionCard key={s.session_id} session={s} />
              ))}
            </div>
          )}

          {meso.microcycles.length === 0 && meso.sessions.length === 0 && (
            <p className="text-xs text-on-surface-variant">Sin contenido</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Plan tree ────────────────────────────────────────────────────────────────

function PlanTree({ plan }: { plan: TrainingPlanTree }) {
  const start = formatDate(plan.start_date)
  const end = formatDate(plan.end_date)

  return (
    <div className="flex flex-col gap-4">
      {(start || end) && (
        <p className="text-xs text-on-surface-variant px-1">
          {start ?? '—'}{end ? ` → ${end}` : ''}
        </p>
      )}

      {plan.description && (
        <p className="text-sm text-on-surface-variant px-1">{plan.description}</p>
      )}

      {plan.mesocycles.map((meso) => (
        <MesocycleBlock key={meso.mesocycle_id} meso={meso} />
      ))}

      {plan.microcycles.length > 0 && (
        <div className="flex flex-col gap-2">
          {plan.microcycles.map((micro) => (
            <MicrocycleBlock key={micro.microcycle_id} micro={micro} />
          ))}
        </div>
      )}

      {plan.sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1">
            Sesiones
          </p>
          {plan.sessions.map((s) => (
            <SessionCard key={s.session_id} session={s} />
          ))}
        </div>
      )}

      {plan.mesocycles.length === 0 && plan.microcycles.length === 0 && plan.sessions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="rounded-full bg-surface-container-high p-5">
            <Dumbbell className="w-6 h-6 text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant">El plan aún no tiene contenido</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PatientPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { data: plan, isLoading, isError } = useTrainingPlanTree(planId)

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex flex-col gap-4">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="px-4 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-on-surface font-medium">No se pudo cargar el plan</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/patient/plans')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 lg:p-6 lg:max-w-2xl lg:mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/patient/plans')}
          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:bg-surface-container-high hover:bg-surface-container-high transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-xl font-semibold text-on-surface leading-tight">{plan.name}</h1>
      </div>

      <PlanTree plan={plan} />
    </div>
  )
}
