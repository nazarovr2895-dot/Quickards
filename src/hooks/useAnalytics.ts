import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export type AnalyticsPeriod = 'day' | 'week' | 'month'

interface Bucket {
  label: string
  new: number
  review: number
}

interface Summary {
  totalReviews: number
  wordsLearned: number
  accuracy: number
  avgPerDay: number
}

export interface AnalyticsData {
  period: string
  buckets: Bucket[]
  summary: Summary
}

export function useAnalytics(userId: number | undefined, period: AnalyticsPeriod) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', userId, period],
    queryFn: () => apiGet<AnalyticsData>(`/api/study/analytics?period=${period}`),
    enabled: !!userId,
  })

  return { data: data ?? null, loading: isLoading }
}
