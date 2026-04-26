import { supabase } from '@/lib/supabase'
import type {
  TrainingExercise,
  CreateTrainingExerciseInput,
  UpdateTrainingExerciseInput,
} from '@/pages/training-plans/types'

const WITH_TAGS = `*, exercise_tag_assignments(exercise_tags(tag_id, name, created_at))`

function mapExercise(raw: Record<string, unknown>): TrainingExercise {
  const { exercise_tag_assignments, ...rest } = raw
  return {
    ...rest,
    tags: ((exercise_tag_assignments as Array<{ exercise_tags: unknown }>) ?? [])
      .map((a) => a.exercise_tags)
      .filter(Boolean),
  } as TrainingExercise
}

async function fetchOne(exerciseId: string): Promise<TrainingExercise> {
  const { data, error } = await supabase
    .from('training_exercises')
    .select(WITH_TAGS)
    .eq('exercise_id', exerciseId)
    .single()
  if (error) throw new Error(error.message)
  return mapExercise(data as Record<string, unknown>)
}

/** Returns only global (system-wide) exercises — those with organization_id IS NULL */
export async function listGlobalExercises(): Promise<TrainingExercise[]> {
  const { data, error } = await supabase
    .from('training_exercises')
    .select(WITH_TAGS)
    .is('organization_id', null)
    .is('deleted_at', null)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapExercise)
}

export async function listTrainingExercises(organizationId: string): Promise<TrainingExercise[]> {
  const { data, error } = await supabase
    .from('training_exercises')
    .select(WITH_TAGS)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .is('deleted_at', null)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapExercise)
}

export async function createTrainingExercise(
  input: CreateTrainingExerciseInput
): Promise<TrainingExercise> {
  const { data: exercise, error } = await supabase
    .from('training_exercises')
    .insert({
      name: input.name,
      organization_id: input.organization_id,
      description: input.description ?? null,
      video_url: input.video_url ?? null,
      execution_type: input.execution_type ?? null,
      default_tempo: input.default_tempo ?? null,
      default_sets: input.default_sets ?? null,
      default_reps: input.default_reps ?? null,
      default_rest_seconds: input.default_rest_seconds ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  const tagIds = input.tag_ids ?? []
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('exercise_tag_assignments')
      .insert(tagIds.map((tag_id) => ({ exercise_id: exercise.exercise_id, tag_id })))
    if (tagError) throw new Error(tagError.message)
  }

  return fetchOne(exercise.exercise_id)
}

export async function updateTrainingExercise(
  input: UpdateTrainingExerciseInput
): Promise<TrainingExercise> {
  const { error } = await supabase
    .from('training_exercises')
    .update({
      name: input.name,
      description: input.description ?? null,
      video_url: input.video_url ?? null,
      execution_type: input.execution_type ?? null,
      default_tempo: input.default_tempo ?? null,
      default_sets: input.default_sets ?? null,
      default_reps: input.default_reps ?? null,
      default_rest_seconds: input.default_rest_seconds ?? null,
    })
    .eq('exercise_id', input.exercise_id)
  if (error) throw new Error(error.message)

  if (input.tag_ids !== undefined) {
    const { error: delError } = await supabase
      .from('exercise_tag_assignments')
      .delete()
      .eq('exercise_id', input.exercise_id)
    if (delError) throw new Error(delError.message)

    if (input.tag_ids.length > 0) {
      const { error: insError } = await supabase
        .from('exercise_tag_assignments')
        .insert(input.tag_ids.map((tag_id) => ({ exercise_id: input.exercise_id, tag_id })))
      if (insError) throw new Error(insError.message)
    }
  }

  return fetchOne(input.exercise_id)
}

export async function toggleExerciseActive(
  exerciseId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from('training_exercises')
    .update({ is_active: isActive })
    .eq('exercise_id', exerciseId)
  if (error) throw new Error(error.message)
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('training_exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('exercise_id', exerciseId)
  if (error) throw new Error(error.message)
}
