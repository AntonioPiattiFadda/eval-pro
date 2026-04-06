import { supabase } from '@/service'

export interface Appointment {
  appointment_id: string
  professional_id: string | null
  patient_id: string | null
  organization_id: string
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  booked_by: string | null
  created_at: string
  patient?: {
    patient_id: string
    user_id: string
    user: {
      full_name: string | null
      email: string | null
    }
  } | null
}

const PATIENT_SELECT = `
  patient:patients!appointments_patient_id_fkey (
    patient_id,
    user_id,
    user:users!patients_user_id_fkey (full_name, email)
  )
`

export async function createAppointment(input: {
  professional_id: string
  patient_id: string
  organization_id: string
  start_at: string
  end_at: string
  booked_by: string
}): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...input, status: 'PENDING' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAppointmentsForDay(
  professionalId: string,
  date: Date
): Promise<Appointment[]> {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, ${PATIENT_SELECT}`)
    .eq('professional_id', professionalId)
    .gte('start_at', start.toISOString())
    .lte('start_at', end.toISOString())
    .order('start_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAppointmentsForProfessional(
  professionalId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, ${PATIENT_SELECT}`)
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
