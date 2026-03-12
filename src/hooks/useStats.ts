import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import type { StudyStats } from '../lib/types'

export function useStats(userId: number | undefined) {
  const [stats, setStats] = useState<StudyStats>({
    dueToday: 0,
    newAvailable: 0,
    totalReviewed: 0,
    streak: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const data = await apiGet<StudyStats>('/api/study/stats')
    setStats(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  return { stats, loading, reload: load }
}
