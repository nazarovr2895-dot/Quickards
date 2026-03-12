import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet } from '../lib/api'
import type { DBSet, CardWithProgress, SetCardsResponse, CardStatusFilter } from '../lib/types'

const PAGE_SIZE = 50
const DEBOUNCE_MS = 300

export function useSetDetail(userId: number | undefined, setId: string | undefined) {
  const [set, setSet] = useState<DBSet | null>(null)
  const [cards, setCards] = useState<CardWithProgress[]>([])
  const [total, setTotal] = useState(0)
  const [breakdown, setBreakdown] = useState({ new: 0, learning: 0, review: 0, mastered: 0 })
  const [dueCount, setDueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CardStatusFilter>('all')
  const abortRef = useRef<AbortController | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  // Load set metadata
  useEffect(() => {
    if (!setId) return
    apiGet<DBSet>(`/api/sets/${setId}`).then(data => {
      if (data) setSet(data)
    })
  }, [setId])

  // Load cards (resets on search/filter change)
  const loadCards = useCallback(async (offset: number, append: boolean) => {
    if (!setId || !userId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!append) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(PAGE_SIZE),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const data = await apiGet<SetCardsResponse>(
        `/api/sets/${setId}/cards-with-progress?${params}`
      )

      if (controller.signal.aborted) return

      if (data) {
        setCards(prev => append ? [...prev, ...data.cards] : data.cards)
        setTotal(data.total)
        setBreakdown(data.breakdown)
        setDueCount(data.dueCount)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [setId, userId, debouncedSearch, statusFilter])

  // Reset and load on filter/search change
  useEffect(() => {
    loadCards(0, false)
  }, [loadCards])

  const loadMore = useCallback(() => {
    loadCards(cards.length, true)
  }, [loadCards, cards.length])

  const hasMore = cards.length < total

  const setSearch = useCallback((s: string) => {
    setSearchRaw(s)
  }, [])

  const reload = useCallback(() => {
    loadCards(0, false)
  }, [loadCards])

  return {
    set,
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
