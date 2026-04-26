import { supabase } from '@/lib/supabase'
import type {
  TrainingSessionExercise,
  CreateSessionExerciseInput,
  UpdateSessionExerciseInput,
} from '@/pages/training-plans/types'

export async function createSessionExercise(
  input: CreateSessionExerciseInput
): Promise<TrainingSessionExercise> {
  const { data, error } = await supabase
    .from('training_session_exercises')
    .insert({
      session_id: input.session_id,
      exercise_id: input.exercise_id,
      organization_id: input.organization_id,
      sets: input.sets,
      reps: input.reps ?? null,
      set_duration_seconds: input.set_duration_seconds ?? null,
      rep_duration_seconds: input.rep_duration_seconds ?? null,
      load_value: input.load_value ?? null,
      load_unit: input.load_unit,
      rest_seconds: input.rest_seconds ?? null,
      order_index: input.order_index ?? 0,
      group_label: input.group_label ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TrainingSessionExercise
}

export async function updateSessionExercise(
  input: UpdateSessionExerciseInput
): Promise<TrainingSessionExercise> {
  const { session_exercise_id, ...fields } = input
  const { data, error } = await supabase
    .from('training_session_exercises')
    .update(fields)
    .eq('session_exercise_id', session_exercise_id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TrainingSessionExercise
}

export async function deleteSessionExercise(sessionExerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('training_session_exercises')
    .delete()
    .eq('session_exercise_id', sessionExerciseId)
  if (error) throw new Error(error.message)
}
