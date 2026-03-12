import { useState, useCallback, useEffect } from 'react'
import './Toast.css'

let globalShowToast: (msg: string) => void = () => {}

export function showToast(message: string) {
  globalShowToast(message)
}

export function ToastProvider() {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(null)
    requestAnimationFrame(() => setMessage(msg))
  }, [])

  useEffect(() => {
    globalShowToast = show
    return () => { globalShowToast = () => {} }
  }, [show])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 2800)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
