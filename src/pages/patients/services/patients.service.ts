import { supabase } from '@/service'
import type { Patient } from '@/types/patients'

export const PAGE_SIZE = 10

export async function searchPatientsPaginated(
  query: string,
  organizationId: string,
  page: number
): Promise<Patient[]> {
  const { data, error } = await supabase.rpc('search_patients', {
    p_org_id: organizationId,
    p_query: query.trim(),
    p_limit: PAGE_SIZE + 1,
    p_offset: page * PAGE_SIZE,
  })
  if (error) throw error
  return (data ?? []).map((row: {
    patient_id: string
    user_id: string
    organization_id: string
    created_at: string
    full_name: string | null
    email: string | null
    identification_number: string | null
  }) => ({
    patient_id: row.patient_id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    created_at: row.created_at,
    user: {
      full_name: row.full_name,
      email: row.email,
      identification_number: row.identification_number,
    },
  }))
}
