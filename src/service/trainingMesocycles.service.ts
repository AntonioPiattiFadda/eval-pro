import { supabase } from '@/lib/supabase'
import type { TrainingMesocycle, CreateMesocycleInput } from '@/pages/training-plans/types'

export async function createMesocycle(input: CreateMesocycleInput): Promise<TrainingMesocycle> {
  const { data, error } = await supabase
    .from('training_mesocycles')
    .insert({
      plan_id: input.plan_id,
      name: input.name,
      organization_id: input.organization_id,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TrainingMesocycle
}

export async function reorderMesocycles(
  updates: { mesocycle_id: string; order_index: number }[]
): Promise<void> {
  await Promise.all(
    updates.map(({ mesocycle_id, order_index }) =>
      supabase.from('training_mesocycles').update({ order_index }).eq('mesocycle_id', mesocycle_id)
    )
  )
}

export async function updateMesocycle(
  mesocycleId: string,
  data: { name?: string; is_active?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('training_mesocycles')
    .update(data)
    .eq('mesocycle_id', mesocycleId)
  if (error) throw new Error(error.message)
}

export async function deleteMesocycle(mesocycleId: string): Promise<void> {
  const { error } = await supabase
    .from('training_mesocycles')
    .delete()
    .eq('mesocycle_id', mesocycleId)
  if (error) throw new Error(error.message)
}
