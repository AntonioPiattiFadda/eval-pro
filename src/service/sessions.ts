import { supabase } from '.'
import type { Session, SessionHistoryItem } from '@/types/session.types'

export async function createDraftSession(input: {
  patientId: string
  professionalId: string
  organizationId: string
  appointmentId: string
}): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      patient_id: input.patientId,
      professional_id: input.professionalId,
      organization_id: input.organizationId,
      appointment_id: input.appointmentId,
    })
    .select('session_id, patient_id, professional_id, region_id, domain_id, objective_id, organization_id, status, created_at')
    .single()
  if (error) throw new Error(error.message)
  return data as Session
}

export async function getSessionByAppointment(appointmentId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, patient_id, professional_id, region_id, domain_id, objective_id, organization_id, status, created_at')
    .eq('appointment_id', appointmentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Session | null
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, patient_id, professional_id, region_id, domain_id, objective_id, organization_id, status, created_at')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Session | null
}

export async function getSessionsByPatient(
  patientId: string,
  excludeSessionId: string
): Promise<SessionHistoryItem[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, created_at, status, domain:domains(name), region:regions(name)')
    .eq('patient_id', patientId)
    .neq('session_id', excludeSessionId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SessionHistoryItem[]
}

export async function updateSessionFields(
  sessionId: string,
  fields: { region_id?: string; domain_id?: string }
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(fields)
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}
