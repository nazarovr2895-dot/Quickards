import { useEffect, useState } from 'react'
import { apiPost } from '../lib/api'
import type { TelegramUser } from '../lib/types'

export function useUser(tgUser: TelegramUser | null) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tgUser) {
      setLoading(false)
      return
    }

    apiPost('/api/users', {
      first_name: tgUser.first_name,
      last_name: tgUser.last_name || null,
      username: tgUser.username || null,
      language_code: tgUser.language_code || 'ru',
    }).finally(() => setLoading(false))
  }, [tgUser])

  return { loading }
}
