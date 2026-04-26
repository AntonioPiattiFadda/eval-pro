import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/service/trainingPlans.service')

import { getTrainingPlanTree } from '@/service/trainingPlans.service'
import { useTrainingPlanTree } from './useTrainingPlanTree'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockTree = {
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
  is_active: true,
  sessions: [],
  mesocycles: [],
  microcycles: [],
}

describe('useTrainingPlanTree', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT fetch when planId is undefined', () => {
    vi.mocked(getTrainingPlanTree).mockResolvedValue(mockTree)

    const { result } = renderHook(() => useTrainingPlanTree(undefined), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(getTrainingPlanTree).not.toHaveBeenCalled()
  })

  it('fetches when planId is set', async () => {
    vi.mocked(getTrainingPlanTree).mockResolvedValue(mockTree)

    const { result } = renderHook(() => useTrainingPlanTree('plan-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getTrainingPlanTree).toHaveBeenCalledWith('plan-1')
    expect(result.current.data).toEqual(mockTree)
  })

  it('returns data on success', async () => {
    vi.mocked(getTrainingPlanTree).mockResolvedValue(mockTree)

    const { result } = renderHook(() => useTrainingPlanTree('plan-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockTree)
    expect(result.current.isError).toBe(false)
  })

  it('sets isError=true on failure', async () => {
    vi.mocked(getTrainingPlanTree).mockRejectedValue(new Error('Tree error'))

    const { result } = renderHook(() => useTrainingPlanTree('plan-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })
})
