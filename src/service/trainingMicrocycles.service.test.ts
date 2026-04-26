import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { createMicrocycle } from './trainingMicrocycles.service'
import { useSoftDeleteMicrocycle } from '@/pages/training-plans/hooks/useSoftDeleteMicrocycle'

const mockMicrocycle = {
  microcycle_id: 'micro-1',
  mesocycle_id: 'meso-1',
  plan_id: null,
  name: 'Week 1',
  order_index: 0,
  repeat_count: 1,
  duration_days: 7,
  deleted_at: null,
  organization_id: 'org-1',
  created_at: '2024-01-01T00:00:00Z',
}

describe('createMicrocycle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls insert with correct payload (mesocycle parent)', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMicrocycle, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const input = { name: 'Week 1', organization_id: 'org-1', mesocycle_id: 'meso-1' }
    const result = await createMicrocycle(input)

    expect(supabase.from).toHaveBeenCalledWith('training_microcycles')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Week 1',
        organization_id: 'org-1',
        mesocycle_id: 'meso-1',
        plan_id: null,
        repeat_count: 1,
        duration_days: 7,
      })
    )
    expect(result).toEqual(mockMicrocycle)
  })

  it('throws on error', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(
      createMicrocycle({ name: 'x', organization_id: 'org-1' })
    ).rejects.toThrow('Insert failed')
  })
})

describe('softDeleteMicrocycle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls soft_delete_microcycle RPC with correct id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await useSoftDeleteMicrocycle('micro-1')

    expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_microcycle', { microcycle_id: 'micro-1' })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Delete failed' } } as never)

    await expect(useSoftDeleteMicrocycle('micro-1')).rejects.toThrow('Delete failed')
  })
})
