import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { togglePlanActive } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'toggle-plan-active'

export function useTogglePlanActive(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (isActive: boolean) => togglePlanActive(planId, isActive),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.lists() })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
