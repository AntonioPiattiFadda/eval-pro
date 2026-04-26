import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { softDeleteTrainingPlan } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'soft-delete-plan'

export function useSoftDeletePlan() {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (planId: string) => softDeleteTrainingPlan(planId),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.lists() })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
