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
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 24px',
        borderRadius: '16px',
        background: 'var(--app-gradient)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        animation: 'toast-fade 2.8s ease-in-out forwards',
        pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(255,107,53,0.25)',
      }}
    >
      {message}
    </div>
  )
}
