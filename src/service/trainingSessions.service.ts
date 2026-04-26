import { supabase } from '@/lib/supabase'
import type { TrainingSession, CreateTrainingSessionInput } from '@/pages/training-plans/types'

export async function createTrainingSession(
  input: CreateTrainingSessionInput
): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      name: input.name,
      organization_id: input.organization_id,
      microcycle_id: input.microcycle_id ?? null,
      mesocycle_id: input.mesocycle_id ?? null,
      plan_id: input.plan_id ?? null,
      day_of_week: input.day_of_week ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TrainingSession
}

/** Move a session to a different parent container, updating the XOR FK constraint atomically */
export async function moveSession(
  sessionId: string,
  params: {
    plan_id: string | null
    mesocycle_id: string | null
    microcycle_id: string | null
    order_index: number
  }
): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .update(params)
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}

export async function reorderSessions(
  updates: { session_id: string; order_index: number }[]
): Promise<void> {
  await Promise.all(
    updates.map(({ session_id, order_index }) =>
      supabase.from('training_sessions').update({ order_index }).eq('session_id', session_id)
    )
  )
}

export async function toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .update({ is_active: isActive })
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}

export async function deleteTrainingSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}
