import { supabase } from '@/lib/supabase'
import type { ExerciseTag } from '@/pages/training-plans/types'

export async function listExerciseTags(): Promise<ExerciseTag[]> {
  const { data, error } = await supabase
    .from('exercise_tags')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ExerciseTag[]
}

export async function createExerciseTag(name: string): Promise<ExerciseTag> {
  const { data, error } = await supabase
    .from('exercise_tags')
    .insert({ name })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ExerciseTag
}

export async function deleteExerciseTag(tagId: string): Promise<void> {
  const { error } = await supabase
    .from('exercise_tags')
    .delete()
    .eq('tag_id', tagId)
  if (error) throw new Error(error.message)
}
