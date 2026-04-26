import { supabase } from '@/lib/supabase'
import type {
  TrainingPlan,
  TrainingPlanTree,
  CreateTrainingPlanInput,
} from '@/pages/training-plans/types'

export async function listTrainingPlans(organizationId: string): Promise<TrainingPlan[]> {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TrainingPlan[]
}

export async function listPatientPlans(
  patientId: string,
  organizationId: string
): Promise<TrainingPlan[]> {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TrainingPlan[]
}

export async function createTrainingPlan(
  input: CreateTrainingPlanInput
): Promise<{ plan_id: string }> {
  const { data, error } = await supabase.rpc('create_training_plan', {
    p_name: input.name,
    p_patient_id: input.patient_id,
    p_organization_id: input.organization_id,
    p_professional_id: input.professional_id,
    p_start_date: input.start_date ?? null,
    p_end_date: input.end_date ?? null,
    p_description: input.description ?? null,
  })
  if (error) throw new Error(error.message)
  return data as { plan_id: string }
}

export async function getTrainingPlanTree(planId: string): Promise<TrainingPlanTree> {
  const { data, error } = await supabase.rpc('get_training_plan_tree', {
    p_plan_id: planId,
  })
  if (error) throw new Error(error.message)
  return data as TrainingPlanTree
}

export async function togglePlanActive(planId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('training_plans')
    .update({ is_active: isActive })
    .eq('plan_id', planId)
  if (error) throw new Error(error.message)
}

export async function softDeleteTrainingPlan(planId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_training_plan', {
    plan_id: planId,
  })
  if (error) throw new Error(error.message)
}
