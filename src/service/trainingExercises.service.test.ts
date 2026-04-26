import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { listTrainingExercises, createTrainingExercise } from './trainingExercises.service'

const mockExercise = {
  exercise_id: 'ex-1',
  name: 'Squat',
  description: null,
  muscle_groups: ['Cuádriceps'],
  video_url: null,
  execution_type: null,
  default_tempo: null,
  default_sets: null,
  default_reps: null,
  default_rest_seconds: null,
  organization_id: 'org-1',
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

describe('listTrainingExercises', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped data on success', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockExercise], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const result = await listTrainingExercises('org-1')

    expect(supabase.from).toHaveBeenCalledWith('training_exercises')
    expect(builder.or).toHaveBeenCalledWith('organization_id.is.null,organization_id.eq.org-1')
    expect(builder.is).toHaveBeenCalledWith('deleted_at', null)
    expect(builder.order).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual([mockExercise])
  })

  it('throws on error', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(listTrainingExercises('org-1')).rejects.toThrow('DB error')
  })
})

describe('createTrainingExercise', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls insert with correct payload and returns single row', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockExercise, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const input = { name: 'Squat', organization_id: 'org-1', muscle_groups: ['Cuádriceps'] }
    const result = await createTrainingExercise(input)

    expect(supabase.from).toHaveBeenCalledWith('training_exercises')
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Squat', organization_id: 'org-1' })
    )
    expect(result).toEqual(mockExercise)
  })

  it('throws on error', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(createTrainingExercise({ name: 'x', organization_id: 'org-1', load_unit: 'NONE' } as never)).rejects.toThrow('Insert failed')
  })
})
