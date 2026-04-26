import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createMesocycle } from '@/service/trainingMesocycles.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'create-mesocycle'

export function useCreateMesocycle(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createMesocycle,
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
