import { useState } from 'react'
import { Dumbbell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useProfessionalId } from '../agenda/hooks/useProfessionalId'
import { useTrainingPlans } from './hooks/useTrainingPlans'
import { PlanCard } from './components/catalog/PlanCard'
import { CreatePlanDialog } from './components/catalog/CreatePlanDialog'

export function TrainingPlansListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? ''
  const { data: professionalId } = useProfessionalId()

  const { data: plans = [], isLoading } = useTrainingPlans(organizationId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          Planes de entrenamiento
        </h1>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="rounded-full bg-surface-container-high p-5">
            <Dumbbell className="h-8 w-8 text-on-surface-variant" />
          </div>
          <div>
            <p className="font-medium text-on-surface">No hay planes aún</p>
            <p className="text-sm text-on-surface-variant mt-1">
              Creá el primer plan de entrenamiento para tus pacientes
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.plan_id} plan={plan} />
          ))}
        </div>
      )}

      <CreatePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organizationId}
        professionalId={professionalId ?? ''}
      />
    </div>
  )
}
