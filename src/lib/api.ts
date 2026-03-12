import { getInitData } from './telegram'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getInitData(),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export function apiGet<T = any>(path: string): Promise<T> {
  return api<T>(path)
}

export function apiPost<T = any>(path: string, body?: any): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiPut<T = any>(path: string, body?: any): Promise<T> {
  return api<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T = any>(path: string): Promise<T> {
  return api<T>(path, { method: 'DELETE' })
}
