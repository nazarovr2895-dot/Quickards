import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TelegramUser } from '../lib/types'

export function useUser(tgUser: TelegramUser | null) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tgUser) {
      setLoading(false)
      return
    }

    const upsert = async () => {
      await supabase.from('users').upsert({
        telegram_id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || null,
        username: tgUser.username || null,
        language_code: tgUser.language_code || 'ru',
      })
      setLoading(false)
    }

    upsert()
  }, [tgUser])

  return { loading }
}
