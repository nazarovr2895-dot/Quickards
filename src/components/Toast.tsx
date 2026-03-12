import { useState, useCallback, useEffect } from 'react'

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
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 24px',
        borderRadius: '12px',
        background: 'var(--app-text)',
        color: 'var(--app-bg)',
        fontSize: '14px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        animation: 'toast-fade 2.8s ease-in-out forwards',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}
