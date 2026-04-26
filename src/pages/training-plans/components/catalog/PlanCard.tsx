import { Link } from 'react-router-dom'
import { CalendarDays, ArrowRight } from 'lucide-react'
import type { TrainingPlan } from '../../types'

interface PlanCardProps {
  plan: TrainingPlan
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <div className="bg-surface-container-high rounded-xl p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-semibold text-on-surface text-base leading-snug line-clamp-2">
          {plan.name}
        </h3>
        {plan.description && (
          <p className="text-on-surface-variant text-sm line-clamp-2">{plan.description}</p>
        )}
      </div>

      {(plan.start_date || plan.end_date) && (
        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>
            {plan.start_date ? formatDate(plan.start_date) : '—'}
            {' → '}
            {plan.end_date ? formatDate(plan.end_date) : '—'}
          </span>
        </div>
      )}

      <Link
        to={`/professional/training-plans/${plan.plan_id}`}
        className="mt-auto inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
      >
        Abrir plan
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
