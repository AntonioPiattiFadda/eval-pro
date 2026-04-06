import { supabase } from '@/service'

export interface PatientAppointment {
  appointment_id: string
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  professional: {
    professional_id: string
    user: { full_name: string | null }
  } | null
  location: {
    location_id: string
    name: string
  } | null
}

const PROFESSIONAL_SELECT = `
  professional:professionals!appointments_professional_id_fkey (
    professional_id,
    user:users!professionals_user_id_fkey (full_name)
  )
`

const LOCATION_SELECT = `
  location:locations!appointments_location_id_fkey (
    location_id,
    name
  )
`

export async function getAppointmentsForPatient(patientId: string): Promise<PatientAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`appointment_id, start_at, end_at, status, ${PROFESSIONAL_SELECT}, ${LOCATION_SELECT}`)
    .eq('patient_id', patientId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PatientAppointment[]
}
