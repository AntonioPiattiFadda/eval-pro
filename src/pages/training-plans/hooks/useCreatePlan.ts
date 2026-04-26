import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createTrainingPlan } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'create-training-plan'

export function useCreatePlan() {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createTrainingPlan,
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.lists() })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
