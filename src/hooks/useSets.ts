import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DBSet, DBUserSet } from '../lib/types'

export function useSystemSets() {
  const [sets, setSets] = useState<DBSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('sets')
        .select('*')
        .eq('is_system', true)
        .order('cefr_level')
      setSets(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return { sets, loading }
}

export function useUserSets(userId: number | undefined) {
  const [sets, setSets] = useState<DBSet[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('sets')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    setSets(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  return { sets, loading, reload: load }
}

export function useSubscribedSets(userId: number | undefined) {
  const [userSets, setUserSets] = useState<DBUserSet[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('user_sets')
      .select('*, sets(*)')
      .eq('user_id', userId)
    setUserSets(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const subscribe = async (setId: string) => {
    if (!userId) return
    await supabase.from('user_sets').insert({ user_id: userId, set_id: setId })
    await load()
  }

  const unsubscribe = async (setId: string) => {
    if (!userId) return
    await supabase.from('user_sets').delete().match({ user_id: userId, set_id: setId })
    await load()
  }

  const isSubscribed = (setId: string) => userSets.some(us => us.set_id === setId)

  return { userSets, loading, subscribe, unsubscribe, isSubscribed, reload: load }
}
