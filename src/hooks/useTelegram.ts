import { useEffect, useState } from 'react'
import { initTelegram, getTelegramUser } from '../lib/telegram'
import { useTheme } from './useTheme'
import type { TelegramUser } from '../lib/types'

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [ready, setReady] = useState(false)

  // Initialize theme (syncs with Telegram/system)
  useTheme()

  useEffect(() => {
    initTelegram()
    setUser(getTelegramUser())
    setReady(true)
  }, [])

  return { user, ready }
}
