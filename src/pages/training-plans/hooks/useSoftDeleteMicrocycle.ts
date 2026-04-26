import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteMicrocycle } from '@/service/trainingMicrocycles.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'soft-delete-microcycle'

export function useSoftDeleteMicrocycle(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (microcycleId: string) => deleteMicrocycle(microcycleId),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
