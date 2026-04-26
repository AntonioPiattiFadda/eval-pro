import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateMicrocycle } from '@/service/trainingMicrocycles.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'update-microcycle'

export function useUpdateMicrocycle(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; repeat_count?: number; duration_days?: number; is_active?: boolean } }) =>
      updateMicrocycle(id, data),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
