import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toggleSessionActive } from '@/service/trainingSessions.service'
import { trainingPlanKeys } from './queryKeys'

const toastId = 'toggle-session-active'

export function useToggleSessionActive(planId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: ({ sessionId, isActive }: { sessionId: string; isActive: boolean }) =>
      toggleSessionActive(sessionId, isActive),
    onMutate: () => { toast.loading('Procesando…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Listo', { id: toastId })
      queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return { mutate, isPending }
}
