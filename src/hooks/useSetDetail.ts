import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { DBSet, CardWithProgress, SetCardsResponse, CardStatusFilter } from '../lib/types'

const PAGE_SIZE = 50
const DEBOUNCE_MS = 300

export function useSetDetail(userId: number | undefined, setId: string | undefined) {
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CardStatusFilter>('all')
  const [offset, setOffset] = useState(0)
  const [allCards, setAllCards] = useState<CardWithProgress[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  // Reset offset when search or filter changes
  useEffect(() => {
    setOffset(0)
    setAllCards([])
  }, [debouncedSearch, statusFilter])

  // Set metadata query
  const { data: set } = useQuery({
    queryKey: ['set', setId],
    queryFn: () => apiGet<DBSet>(`/api/sets/${setId}`),
    enabled: !!setId,
  })

  // Cards query
  const buildParams = useCallback(() => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(PAGE_SIZE),
    })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    return params.toString()
  }, [offset, debouncedSearch, statusFilter])

  const {
    data: cardsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['set-cards', setId, debouncedSearch, statusFilter, offset],
    queryFn: () =>
      apiGet<SetCardsResponse>(
        `/api/sets/${setId}/cards-with-progress?${buildParams()}`
      ),
    enabled: !!setId && !!userId,
  })

  // Accumulate cards for "load more" pagination
  useEffect(() => {
    if (!cardsData) return
    if (offset === 0) {
      setAllCards(cardsData.cards)
    } else {
      setAllCards(prev => [...prev, ...cardsData.cards])
    }
  }, [cardsData, offset])

  const cards = allCards
  const total = cardsData?.total ?? 0
  const breakdown = cardsData?.breakdown ?? { new: 0, learning: 0, review: 0, mastered: 0 }
  const dueCount = cardsData?.dueCount ?? 0
  const loading = isLoading
  const loadingMore = offset > 0 && isFetching

  const hasMore = cards.length < total

  const loadMore = useCallback(() => {
    setOffset(cards.length)
  }, [cards.length])

  const setSearch = useCallback((s: string) => {
    setSearchRaw(s)
  }, [])

  const reload = useCallback(() => {
    setOffset(0)
    setAllCards([])
    refetch()
  }, [refetch])

  return {
    set: set ?? null,
    cards,
    total,
    breakdown,
    dueCount,
    loading,
    loadingMore,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loadMore,
    hasMore,
    reload,
  }
}
