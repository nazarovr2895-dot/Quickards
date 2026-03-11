import { useEffect, useState } from 'react'
import { initTelegram, getTelegramUser } from '../lib/telegram'
import type { TelegramUser } from '../lib/types'

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initTelegram()
    setUser(getTelegramUser())
    setReady(true)
  }, [])

  return { user, ready }
}
