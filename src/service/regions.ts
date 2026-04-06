import { supabase } from '.'
import type { Region } from '@/types/region.types'

export async function getRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('region_id, name')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
