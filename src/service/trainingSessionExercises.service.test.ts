import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import {
  createSessionExercise,
  updateSessionExercise

} from './trainingSessionExercises.service'
import { useSoftDeleteSessionExercise } from '@/pages/training-plans/hooks/useSoftDeleteSessionExercise'

const mockSessionExercise = {
  session_exercise_id: 'se-1',
  session_id: 'sess-1',
  exercise_id: 'ex-1',
  sets: 3,
  reps: 10,
  set_duration_seconds: null,
  rep_duration_seconds: null,
  load_value: 80,
  load_unit: 'KG',
  rest_seconds: 90,
  order_index: 0,
  group_label: null,
  notes: null,
  deleted_at: null,
  organization_id: 'org-1',
  created_at: '2024-01-01T00:00:00Z',
}

describe('createSessionExercise', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls insert with correct payload', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSessionExercise, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const input = {
      session_id: 'sess-1',
      exercise_id: 'ex-1',
      organization_id: 'org-1',
      sets: 3,
      reps: 10,
      load_value: 80,
      load_unit: 'KG' as const,
      rest_seconds: 90,
    }
    const result = await createSessionExercise(input)

    expect(supabase.from).toHaveBeenCalledWith('training_session_exercises')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sess-1',
        exercise_id: 'ex-1',
        organization_id: 'org-1',
        sets: 3,
        reps: 10,
        load_value: 80,
        load_unit: 'KG',
      })
    )
    expect(result).toEqual(mockSessionExercise)
  })

  it('throws on error', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(
      createSessionExercise({
        session_id: 's',
        exercise_id: 'e',
        organization_id: 'o',
        sets: 1,
        load_unit: 'NONE',
      })
    ).rejects.toThrow('Insert failed')
  })
})

describe('updateSessionExercise', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls update with correct fields and eq filter', async () => {
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockSessionExercise, reps: 12 }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const result = await updateSessionExercise({ session_exercise_id: 'se-1', reps: 12 })

    expect(supabase.from).toHaveBeenCalledWith('training_session_exercises')
    expect(builder.update).toHaveBeenCalledWith({ reps: 12 })
    expect(builder.eq).toHaveBeenCalledWith('session_exercise_id', 'se-1')
    expect(result.reps).toBe(12)
  })

  it('throws on error', async () => {
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(
      updateSessionExercise({ session_exercise_id: 'se-1', reps: 5 })
    ).rejects.toThrow('Update failed')
  })
})

describe('softDeleteSessionExercise', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls soft_delete_session_exercise RPC with correct id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await useSoftDeleteSessionExercise('se-1')

    expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_session_exercise', {
      session_exercise_id: 'se-1',
    })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Delete failed' } } as never)

    await expect(useSoftDeleteSessionExercise('se-1')).rejects.toThrow('Delete failed')
  })
})
