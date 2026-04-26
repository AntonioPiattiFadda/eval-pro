import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/service/trainingPlans.service')
vi.mock('sonner')

import { createTrainingPlan } from '@/service/trainingPlans.service'
import { toast } from 'sonner'
import { useCreatePlan } from './useCreatePlan'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const validInput = {
  name: 'Plan A',
  patient_id: 'pat-1',
  organization_id: 'org-1',
  professional_id: 'prof-1',
}

describe('useCreatePlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows toast.loading when mutation starts', async () => {
    vi.mocked(createTrainingPlan).mockImplementation(
      () => new Promise(() => {}) // never resolves — keeps isPending=true
    )

    const { result } = renderHook(() => useCreatePlan(), {
      wrapper: makeWrapper(),
    })

    act(() => { result.current.mutate(validInput) })

    expect(toast.loading).toHaveBeenCalledWith('Procesando…', { id: 'create-training-plan' })
  })

  it('shows toast.success and invalidates cache on success', async () => {
    vi.mocked(createTrainingPlan).mockResolvedValue({ plan_id: 'plan-new' })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreatePlan(), { wrapper })

    await act(async () => { result.current.mutate(validInput) })

    expect(toast.success).toHaveBeenCalledWith('Listo', { id: 'create-training-plan' })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['training-plans', 'list'],
    })
  })

  it('shows toast.error with the error message on failure', async () => {
    vi.mocked(createTrainingPlan).mockRejectedValue(new Error('RPC failed'))

    const { result } = renderHook(() => useCreatePlan(), {
      wrapper: makeWrapper(),
    })

    await act(async () => { result.current.mutate(validInput) })

    expect(toast.error).toHaveBeenCalledWith('RPC failed', { id: 'create-training-plan' })
  })
})
