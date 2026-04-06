import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPatientsPaginated, PAGE_SIZE } from '../services/patients.service'

export function usePatientsSearch(query: string, organizationId: string) {
  const [pageIndex, setPageIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce the query 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  // Reset to page 0 whenever the debounced query changes
  useEffect(() => {
    setPageIndex(0)
  }, [debouncedQuery])

  const { data: rawData = [], isFetching, isError, error } = useQuery({
    queryKey: ['patients-search', debouncedQuery, pageIndex, organizationId],
    queryFn: () => searchPatientsPaginated(debouncedQuery, organizationId, pageIndex),
    enabled: debouncedQuery.trim().length > 0 && !!organizationId,
    staleTime: 30_000,
  })

  const hasNextPage = rawData.length > PAGE_SIZE
  const data = rawData.slice(0, PAGE_SIZE)

  return {
    data,
    isFetching,
    isError,
    error,
    pageIndex,
    hasNextPage,
    hasSearch: debouncedQuery.trim().length > 0,
    goToNextPage: () => setPageIndex((p) => p + 1),
    goToPrevPage: () => setPageIndex((p) => p - 1),
  }
}
