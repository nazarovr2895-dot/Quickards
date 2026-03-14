import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { DBSet } from '../lib/types'

interface UserSetRow {
  user_id: number
  set_id: string
  added_at: string
  sets: DBSet
  learned_count: number
}

export function useSystemSets() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-sets'],
    queryFn: () => apiGet<DBSet[]>('/api/sets/system'),
    staleTime: 5 * 60_000,
  })

  return { sets: data ?? [], loading: isLoading }
}

export function useUserSets(userId: number | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-sets', userId],
    queryFn: () => apiGet<DBSet[]>('/api/sets/user'),
    enabled: !!userId,
  })

  return { sets: data ?? [], loading: isLoading, reload: refetch }
}

export function useSubscribedSets(userId: number | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscribed-sets', userId],
    queryFn: () => apiGet<UserSetRow[]>('/api/user-sets'),
    enabled: !!userId,
  })

  const userSets = data ?? []

  const subscribeMutation = useMutation({
    mutationFn: (setId: string) => apiPost('/api/user-sets', { set_id: setId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribed-sets'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const unsubscribeMutation = useMutation({
    mutationFn: (setId: string) => apiDelete(`/api/user-sets/${setId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribed-sets'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const subscribe = async (setId: string) => {
    if (!userId) return
    await subscribeMutation.mutateAsync(setId)
  }

  const unsubscribe = async (setId: string) => {
    if (!userId) return
    await unsubscribeMutation.mutateAsync(setId)
  }

  const isSubscribed = (setId: string) => userSets.some(us => us.set_id === setId)

  return { userSets, loading: isLoading, subscribe, unsubscribe, isSubscribed, reload: refetch }
}
