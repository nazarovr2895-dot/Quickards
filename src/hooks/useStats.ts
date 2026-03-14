import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { StudyStats } from '../lib/types'

const defaultStats: StudyStats = {
  dueToday: 0,
  newAvailable: 0,
  totalReviewed: 0,
  streak: 0,
  dailyGoal: 20,
  reviewedToday: 0,
  streakFreezes: 1,
}

export function useStats(userId: number | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats', userId],
    queryFn: () => apiGet<StudyStats>('/api/study/stats'),
    enabled: !!userId,
    staleTime: 30_000,
  })

  return {
    stats: data ?? defaultStats,
    loading: isLoading,
    reload: refetch,
  }
}
