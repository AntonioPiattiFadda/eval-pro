import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import {
  listTrainingPlans,
  createTrainingPlan,
  getTrainingPlanTree,
  softDeleteTrainingPlan,
} from './trainingPlans.service'

const mockPlan = {
  plan_id: 'plan-1',
  name: 'Plan A',
  description: null,
  patient_id: 'pat-1',
  organization_id: 'org-1',
  professional_id: 'prof-1',
  start_date: null,
  end_date: null,
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

describe('listTrainingPlans', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns plans filtered by organization', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockPlan], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const result = await listTrainingPlans('org-1')

    expect(supabase.from).toHaveBeenCalledWith('training_plans')
    expect(builder.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(builder.is).toHaveBeenCalledWith('deleted_at', null)
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([mockPlan])
  })

  it('throws on error', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(listTrainingPlans('org-1')).rejects.toThrow('Query failed')
  })
})

describe('createTrainingPlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls create_training_plan RPC with correct args', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { plan_id: 'plan-1' }, error: null } as never)

    const input = {
      name: 'Plan A',
      patient_id: 'pat-1',
      organization_id: 'org-1',
      professional_id: 'prof-1',
    }
    const result = await createTrainingPlan(input)

    expect(supabase.rpc).toHaveBeenCalledWith('create_training_plan', {
      p_name: 'Plan A',
      p_patient_id: 'pat-1',
      p_organization_id: 'org-1',
      p_professional_id: 'prof-1',
      p_start_date: null,
      p_end_date: null,
      p_description: null,
    })
    expect(result).toEqual({ plan_id: 'plan-1' })
  })

  it('throws on RPC error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'RPC failed' } } as never)

    await expect(
      createTrainingPlan({ name: 'x', patient_id: 'p', organization_id: 'o', professional_id: 'pr' })
    ).rejects.toThrow('RPC failed')
  })
})

describe('getTrainingPlanTree', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls get_training_plan_tree RPC with plan_id', async () => {
    const mockTree = { ...mockPlan, sessions: [], mesocycles: [], microcycles: [] }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockTree, error: null } as never)

    const result = await getTrainingPlanTree('plan-1')

    expect(supabase.rpc).toHaveBeenCalledWith('get_training_plan_tree', { plan_id: 'plan-1' })
    expect(result).toEqual(mockTree)
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Tree error' } } as never)

    await expect(getTrainingPlanTree('plan-1')).rejects.toThrow('Tree error')
  })
})

describe('softDeleteTrainingPlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls soft_delete_training_plan RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await softDeleteTrainingPlan('plan-1')

    expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_training_plan', { plan_id: 'plan-1' })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Delete failed' } } as never)

    await expect(softDeleteTrainingPlan('plan-1')).rejects.toThrow('Delete failed')
  })
})
