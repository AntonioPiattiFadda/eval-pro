import { useQuery } from '@tanstack/react-query'
import { listTrainingPlans } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from './queryKeys'

export function useTrainingPlans(organizationId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: trainingPlanKeys.lists(),
    queryFn: () => listTrainingPlans(organizationId),
    enabled: !!organizationId,
    staleTime: 30_000,
  })

  return { data: data ?? [], isLoading, isError }
}
