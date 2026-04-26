import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteSessionExercise } from '@/service/trainingSessionExercises.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'soft-delete-session-exercise'

export function useSoftDeleteSessionExercise(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (sessionExerciseId: string) => deleteSessionExercise(sessionExerciseId),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
