import { supabase } from '.'
import type { Phase1Question } from '@/types/anamnesis.types'

export async function getPhase1Questions(): Promise<Phase1Question[]> {
  const { data, error } = await supabase
    .from('anamnesis_phase1_questions')
    .select('question_id, question, options, order_index')
    .order('order_index', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Phase1Question[]
}

export async function getExistingPhase1Answers(
  sessionId: string
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('anamnesis_answers')
    .select('question_id, answer')
    .eq('session_id', sessionId)
    .eq('phase', 'PHASE1')
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map(r => [r.question_id, r.answer]))
}

export async function upsertPhase1Answer(input: {
  sessionId: string
  questionId: string
  answer: string
  organizationId: string
}): Promise<void> {
  const { error } = await supabase
    .from('anamnesis_answers')
    .upsert(
      {
        session_id: input.sessionId,
        question_id: input.questionId,
        phase: 'PHASE1',
        answer: input.answer,
        organization_id: input.organizationId,
      },
      { onConflict: 'session_id,question_id' }
    )
  if (error) throw new Error(error.message)
}
