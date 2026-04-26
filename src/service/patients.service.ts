import { supabase } from '.'
import type { PatientInfo } from '@/types/patient.types'
import type { Patient } from '@/types/patients'

export async function invitePatient(input: {
  email: string
  full_name: string
  identification_number?: string
  organization_id: string
}): Promise<Patient> {
  const { data, error } = await supabase.functions.invoke('invite-patient', {
    body: {
      ...input,
      redirectTo: `${window.location.origin}/reset-password`,
    },
  })
  if (error) {
    const body = await (error as { context?: { json(): Promise<{ error?: string }> } }).context?.json().catch(() => null)
    if (body?.error) throw new Error(body.error)
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data as Patient
}

export async function searchPatients(
  query: string,
  organizationId: string
): Promise<Patient[]> {
  if (!query.trim()) return []
  const { data, error } = await supabase.rpc('search_patients', {
    p_org_id: organizationId,
    p_query: query.trim(),
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

export async function getPatient(patientId: string): Promise<PatientInfo | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id, user_id, user:users!patients_user_id_fkey(full_name, email, identification_number)')
    .eq('patient_id', patientId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as PatientInfo | null
}
