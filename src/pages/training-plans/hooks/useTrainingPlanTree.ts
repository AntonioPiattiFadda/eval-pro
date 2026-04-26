import { useQuery } from '@tanstack/react-query'
import { getTrainingPlanTree } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from './queryKeys'

export function useTrainingPlanTree(planId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: trainingPlanKeys.tree(planId!),
    queryFn: () => getTrainingPlanTree(planId!),
    enabled: !!planId,
    staleTime: 30_000,
  })

  return { data, isLoading, isError }
}
