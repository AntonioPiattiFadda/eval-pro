import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/service/trainingExercises.service')

import { listTrainingExercises } from '@/service/trainingExercises.service'
import { useTrainingExercises } from './useTrainingExercises'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockExercises = [
  {
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
    tags: [],
    is_active: true,
  },
]

describe('useTrainingExercises', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT fetch when organizationId is empty', () => {
    vi.mocked(listTrainingExercises).mockResolvedValue([])

    const { result } = renderHook(() => useTrainingExercises(''), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(listTrainingExercises).not.toHaveBeenCalled()
  })

  it('returns data on success', async () => {
    vi.mocked(listTrainingExercises).mockResolvedValue(mockExercises)

    const { result } = renderHook(() => useTrainingExercises('org-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockExercises)
    expect(result.current.isError).toBe(false)
  })

  it('returns empty array when no exercises', async () => {
    vi.mocked(listTrainingExercises).mockResolvedValue([])

    const { result } = renderHook(() => useTrainingExercises('org-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual([])
  })
})
