import WebApp from '@twa-dev/sdk'
import type { TelegramUser } from './types'

export function isTelegram(): boolean {
  return !!WebApp.initData
}

export function initTelegram() {
  WebApp.ready()

  try {
    WebApp.setHeaderColor('secondary_bg_color')
  } catch {}

  try {
    WebApp.disableVerticalSwipes()
  } catch {}
}

export function getTelegramUser(): TelegramUser | null {
  const user = WebApp.initDataUnsafe?.user
  if (!user) return null
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
  }
}

export function getInitData(): string {
  return WebApp.initData || ''
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    WebApp.HapticFeedback.impactOccurred(type)
  } catch {}
}

export function hapticNotification(type: 'success' | 'warning' | 'error') {
  try {
    WebApp.HapticFeedback.notificationOccurred(type)
  } catch {}
}

export function showBackButton(onClick: () => void) {
  WebApp.BackButton.show()
  WebApp.BackButton.onClick(onClick)
  return () => {
    WebApp.BackButton.offClick(onClick)
    WebApp.BackButton.hide()
  }
}

export function showMainButton(text: string, onClick: () => void) {
  WebApp.MainButton.setText(text)
  WebApp.MainButton.show()
  WebApp.MainButton.onClick(onClick)
  return () => {
    WebApp.MainButton.offClick(onClick)
    WebApp.MainButton.hide()
  }
}

export function setMainButtonLoading(loading: boolean) {
  if (loading) {
    WebApp.MainButton.showProgress()
  } else {
    WebApp.MainButton.hideProgress()
  }
}

export function showAlert(message: string) {
  if (isTelegram()) {
    WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

export function showConfirm(message: string, callback: (ok: boolean) => void) {
  if (isTelegram()) {
    WebApp.showConfirm(message, callback)
  } else {
    callback(window.confirm(message))
  }
}

export function openLink(url: string) {
  try {
    WebApp.openLink(url)
  } catch {
    window.open(url, '_blank')
  }
}

export const colorScheme = WebApp.colorScheme
