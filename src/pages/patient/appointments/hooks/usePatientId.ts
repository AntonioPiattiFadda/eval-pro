import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/service'
import { useAuth } from '@/contexts/AuthContext'

async function fetchPatientId(userId: string, organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.patient_id ?? null
}

export function usePatientId() {
  const { user, profile } = useAuth()
  const organizationId = profile?.organization_id ?? null

  return useQuery({
    queryKey: ['patient-id', user?.id, organizationId],
    queryFn: () => fetchPatientId(user!.id, organizationId!),
    enabled: !!user?.id && !!organizationId,
    staleTime: Infinity,
  })
}
