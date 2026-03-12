import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete } from '../lib/api'
import type { DBSet } from '../lib/types'

interface UserSetRow {
  user_id: number
  set_id: string
  added_at: string
  sets: DBSet
  learned_count: number
}

export function useSystemSets() {
  const [sets, setSets] = useState<DBSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<DBSet[]>('/api/sets/system')
      .then(data => setSets(data || []))
      .finally(() => setLoading(false))
  }, [])

  return { sets, loading }
}

export function useUserSets(userId: number | undefined) {
  const [sets, setSets] = useState<DBSet[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const data = await apiGet<DBSet[]>('/api/sets/user')
      setSets(data || [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { sets, loading, reload: load }
}

export function useSubscribedSets(userId: number | undefined) {
  const [userSets, setUserSets] = useState<UserSetRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const data = await apiGet<UserSetRow[]>('/api/user-sets')
      setUserSets(data || [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const subscribe = async (setId: string) => {
    if (!userId) return
    await apiPost('/api/user-sets', { set_id: setId })
    await load()
  }

  const unsubscribe = async (setId: string) => {
    if (!userId) return
    await apiDelete(`/api/user-sets/${setId}`)
    await load()
  }

  const isSubscribed = (setId: string) => userSets.some(us => us.set_id === setId)

  return { userSets, loading, subscribe, unsubscribe, isSubscribed, reload: load }
}
