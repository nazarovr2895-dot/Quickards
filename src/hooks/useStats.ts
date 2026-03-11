import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { endOfToday } from '../lib/utils'
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

    const [dueRes, reviewedRes] = await Promise.all([
      supabase
        .from('user_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('due', endOfToday())
        .gt('reps', 0),
      supabase
        .from('user_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('reps', 0),
    ])

    setStats({
      dueToday: dueRes.count || 0,
      newAvailable: 0,
      totalReviewed: reviewedRes.count || 0,
      streak: 0,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  return { stats, loading, reload: load }
}
