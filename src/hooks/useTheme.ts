import { useEffect, useState } from 'react'
import { isTelegram } from '../lib/telegram'
import WebApp from '@twa-dev/sdk'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'quickards-theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored

    if (isTelegram()) {
      return WebApp.colorScheme === 'dark' ? 'dark' : 'light'
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff')
    }
  }, [theme])

  useEffect(() => {
    if (!isTelegram()) return
    const cs = WebApp.colorScheme
    if (cs) {
      const t = cs === 'dark' ? 'dark' : 'light'
      setTheme(t)
      localStorage.setItem(STORAGE_KEY, t)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { theme, setTheme, toggleTheme }
}
