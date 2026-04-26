import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { createTrainingSession } from './trainingSessions.service'
import { useSoftDeleteTrainingSession } from '@/pages/training-plans/hooks/useSoftDeleteTrainingSession'

const mockSession = {
  session_id: 'sess-1',
  microcycle_id: 'micro-1',
  mesocycle_id: null,
  plan_id: null,
  name: 'Day A',
  day_of_week: [1],
  order_index: 0,
  deleted_at: null,
  organization_id: 'org-1',
  created_at: '2024-01-01T00:00:00Z',
}

describe('createTrainingSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls insert with correct payload', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const input = { name: 'Day A', organization_id: 'org-1', microcycle_id: 'micro-1', day_of_week: [1] }
    const result = await createTrainingSession(input)

    expect(supabase.from).toHaveBeenCalledWith('training_sessions')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Day A',
        organization_id: 'org-1',
        microcycle_id: 'micro-1',
        mesocycle_id: null,
        plan_id: null,
        day_of_week: [1],
      })
    )
    expect(result).toEqual(mockSession)
  })

  it('throws on error', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(
      createTrainingSession({ name: 'x', organization_id: 'org-1' })
    ).rejects.toThrow('Insert failed')
  })
})

describe('softDeleteTrainingSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls soft_delete_training_session RPC with correct id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await useSoftDeleteTrainingSession('sess-1')

    expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_training_session', { session_id: 'sess-1' })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Delete failed' } } as never)

    await expect(useSoftDeleteTrainingSession('sess-1')).rejects.toThrow('Delete failed')
  })
})
