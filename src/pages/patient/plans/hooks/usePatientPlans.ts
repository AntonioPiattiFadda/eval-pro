import { useQuery } from '@tanstack/react-query'
import { listPatientPlans } from '@/service/trainingPlans.service'
import { trainingPlanKeys } from '@/pages/training-plans/hooks/queryKeys'

export function usePatientPlans(patientId: string | null | undefined, organizationId: string | null | undefined) {
  return useQuery({
    queryKey: [...trainingPlanKeys.lists(), 'patient', patientId],
    queryFn: () => listPatientPlans(patientId!, organizationId!),
    enabled: !!patientId && !!organizationId,
    staleTime: 1000 * 60 * 5,
  })
}
