import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteTrainingSession } from '@/service/trainingSessions.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'soft-delete-training-session'

export function useSoftDeleteTrainingSession(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (sessionId: string) => deleteTrainingSession(sessionId),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
