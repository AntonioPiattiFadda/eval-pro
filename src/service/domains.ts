import { supabase } from '.'
import type { Domain } from '@/types/domain.types'

export async function getDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('domain_id, name')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
