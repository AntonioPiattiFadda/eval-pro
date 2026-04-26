import { supabase } from '@/lib/supabase'
import type { TrainingMicrocycle, CreateMicrocycleInput } from '@/pages/training-plans/types'

export async function createMicrocycle(input: CreateMicrocycleInput): Promise<TrainingMicrocycle> {
  const { data, error } = await supabase
    .from('training_microcycles')
    .insert({
      name: input.name,
      organization_id: input.organization_id,
      mesocycle_id: input.mesocycle_id ?? null,
      plan_id: input.plan_id ?? null,
      repeat_count: input.repeat_count ?? 1,
      duration_days: input.duration_days ?? 7,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TrainingMicrocycle
}

export async function reorderMicrocycles(
  updates: { microcycle_id: string; order_index: number }[]
): Promise<void> {
  await Promise.all(
    updates.map(({ microcycle_id, order_index }) =>
      supabase.from('training_microcycles').update({ order_index }).eq('microcycle_id', microcycle_id)
    )
  )
}

export async function updateMicrocycle(
  microcycleId: string,
  data: { name?: string; repeat_count?: number; duration_days?: number; is_active?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('training_microcycles')
    .update(data)
    .eq('microcycle_id', microcycleId)
  if (error) throw new Error(error.message)
}

export async function deleteMicrocycle(microcycleId: string): Promise<void> {
  const { error } = await supabase
    .from('training_microcycles')
    .delete()
    .eq('microcycle_id', microcycleId)
  if (error) throw new Error(error.message)
}
