import { supabase } from '@/service'
import type { Patient } from './patients.service'

export interface Appointment {
  appointment_id: string
  professional_id: string | null
  patient_id: string | null
  start_at: string
  end_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  booked_by: string | null
  created_at: string
  patient?: Pick<Patient, 'full_name' | 'email'> | null
}

export async function createAppointment(input: {
  professional_id: string
  patient_id: string
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

export async function getAppointmentsForProfessional(
  professionalId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(full_name, email)')
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => {
    const { patients, ...rest } = row
    return {
      ...rest,
      patient: patients as Pick<Patient, 'full_name' | 'email'> | null,
    }
  })
}
