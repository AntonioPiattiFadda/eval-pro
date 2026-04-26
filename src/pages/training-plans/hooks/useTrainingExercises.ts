import { useQuery } from '@tanstack/react-query'
import { listTrainingExercises } from '@/service/trainingExercises.service'
import { trainingPlanKeys } from './queryKeys'

export function useTrainingExercises(organizationId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: trainingPlanKeys.exercises,
    queryFn: () => listTrainingExercises(organizationId),
    enabled: !!organizationId,
    staleTime: Infinity,
  })

  return { data: data ?? [], isLoading, isError }
}
