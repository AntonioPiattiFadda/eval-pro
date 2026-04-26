import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePatientId } from '../appointments/hooks/usePatientId'
import { usePatientPlans } from './hooks/usePatientPlans'
import type { TrainingPlan } from '@/pages/training-plans/types'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PlanCard({ plan }: { plan: TrainingPlan }) {
  const startDate = formatDate(plan.start_date)
  const endDate = formatDate(plan.end_date)

  return (
    <Link
      to={`/patient/plans/${plan.plan_id}`}
      className="flex flex-col gap-2 px-4 py-4 rounded-2xl lg:rounded-xl bg-surface-container border border-outline-variant active:bg-surface-container-high hover:bg-surface-container-high transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-on-surface leading-snug">{plan.name}</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 bg-green-500/10 text-green-400">
          Activo
        </span>
      </div>

      {plan.description && (
        <p className="text-xs text-on-surface-variant leading-relaxed">{plan.description}</p>
      )}

      {(startDate || endDate) && (
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{startDate ?? '—'}{endDate ? ` → ${endDate}` : ''}</span>
        </div>
      )}

      <span className="text-xs text-primary hidden lg:inline">Ver plan completo →</span>
    </Link>
  )
}

function PlansSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-4 rounded-2xl lg:rounded-xl bg-surface-container border border-outline-variant space-y-3 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-4 bg-outline-variant rounded w-2/3" />
            <div className="h-5 bg-outline-variant rounded-full w-14" />
          </div>
          <div className="h-3 bg-outline-variant rounded w-full" />
          <div className="h-3 bg-outline-variant rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}

export function PlansPage() {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? null

  const { data: patientId, isLoading: patientIdLoading } = usePatientId()
  const { data: plans = [], isLoading: plansLoading, isError, error } = usePatientPlans(patientId, organizationId)

  const isLoading = patientIdLoading || plansLoading

  return (
    <div className="px-4 py-6 lg:p-6 lg:max-w-2xl lg:mx-auto flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold text-on-surface">Mis planes</h1>

      {isLoading && <PlansSkeleton />}

      {!isLoading && isError && (
        <div className="text-center py-16 text-destructive text-sm">
          {(error as Error)?.message ?? 'Error al cargar los planes'}
        </div>
      )}

      {!isLoading && !isError && plans.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant text-sm">
          No tenés planes de entrenamiento activos
        </div>
      )}

      {!isLoading && !isError && plans.length > 0 && (
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <PlanCard key={plan.plan_id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  )
}
