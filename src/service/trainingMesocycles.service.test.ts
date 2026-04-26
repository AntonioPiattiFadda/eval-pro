import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { createMesocycle } from './trainingMesocycles.service'
import { useSoftDeleteMesocycle } from '@/pages/training-plans/hooks/useSoftDeleteMesocycle'

const mockMesocycle = {
  mesocycle_id: 'meso-1',
  plan_id: 'plan-1',
  name: 'Block 1',
  order_index: 0,
  periodization_type: null,
  deleted_at: null,
  organization_id: 'org-1',
  created_at: '2024-01-01T00:00:00Z',
}

describe('createMesocycle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls insert with correct payload', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMesocycle, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const input = { plan_id: 'plan-1', name: 'Block 1', organization_id: 'org-1' }
    const result = await createMesocycle(input)

    expect(supabase.from).toHaveBeenCalledWith('training_mesocycles')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: 'plan-1', name: 'Block 1', organization_id: 'org-1' })
    )
    expect(result).toEqual(mockMesocycle)
  })

  it('throws on error', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(
      createMesocycle({ plan_id: 'plan-1', name: 'x', organization_id: 'org-1' })
    ).rejects.toThrow('Insert failed')
  })
})

describe('softDeleteMesocycle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls soft_delete_mesocycle RPC with correct id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await useSoftDeleteMesocycle('meso-1')

    expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_mesocycle', { mesocycle_id: 'meso-1' })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Delete failed' } } as never)

    await expect(useSoftDeleteMesocycle('meso-1')).rejects.toThrow('Delete failed')
  })
})
