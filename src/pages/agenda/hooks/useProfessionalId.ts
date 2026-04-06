import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/service'
import { useAuth } from '@/contexts/AuthContext'

async function fetchProfessionalId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('professional_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.professional_id ?? null
}

export function useProfessionalId() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['professional-id', user?.id],
    queryFn: () => fetchProfessionalId(user!.id),
    enabled: !!user?.id,
    staleTime: Infinity,
  })
}
