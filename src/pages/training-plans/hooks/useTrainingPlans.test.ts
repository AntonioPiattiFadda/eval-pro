import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/service/trainingPlans.service')

import { listTrainingPlans } from '@/service/trainingPlans.service'
import { useTrainingPlans } from './useTrainingPlans'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockPlans = [
  {
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
  },
]

describe('useTrainingPlans', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT fetch when organizationId is empty', () => {
    vi.mocked(listTrainingPlans).mockResolvedValue([])

    const { result } = renderHook(() => useTrainingPlans(''), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(listTrainingPlans).not.toHaveBeenCalled()
  })

  it('shows loading state while fetching', async () => {
    vi.mocked(listTrainingPlans).mockImplementation(
      () => new Promise(() => {}) // never resolves
    )

    const { result } = renderHook(() => useTrainingPlans('org-1'), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    vi.mocked(listTrainingPlans).mockResolvedValue(mockPlans)

    const { result } = renderHook(() => useTrainingPlans('org-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockPlans)
    expect(result.current.isError).toBe(false)
  })

  it('returns empty array and isError=true on failure', async () => {
    vi.mocked(listTrainingPlans).mockRejectedValue(new Error('Query failed'))

    const { result } = renderHook(() => useTrainingPlans('org-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toEqual([])
  })
})
