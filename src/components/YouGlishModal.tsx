import { useState, useEffect, useRef } from 'react'
import './YouGlishModal.css'

interface Props {
  word: string
  isOpen: boolean
  onClose: () => void
}

let scriptPromise: Promise<void> | null = null
let scriptFailed = false

function loadYouGlishScript(): Promise<void> {
  if (scriptFailed) return Promise.reject(new Error('YouGlish blocked'))
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    ;(window as any).onYouglishAPIReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://youglish.com/public/emb/widget.js'
    script.async = true
    script.charset = 'utf-8'
    script.onerror = () => {
      scriptFailed = true
      scriptPromise = null
      reject(new Error('Failed to load YouGlish'))
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

export function YouGlishModal({ word, isOpen, onClose }: Props) {
  const widgetRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setError(null)

    loadYouGlishScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const YG = (window as any).YG
        widgetRef.current = new YG.Widget('yg-widget', {
          width: '100%',
          components: 6,
        })
        widgetRef.current.fetch(word, 'english')
      })
      .catch(() => {
        if (!cancelled) setError('YouGlish unavailable. Try opening in browser.')
      })

    return () => {
      cancelled = true
      if (widgetRef.current) {
        try {
          widgetRef.current.close()
        } catch {
          // DOM already removed by React — safe to ignore
        }
        widgetRef.current = null
      }
    }
  }, [isOpen, word])

  if (!isOpen) return null

  return (
    <div className="youglish-modal" onClick={onClose}>
      <div className="youglish-modal__content" onClick={e => e.stopPropagation()}>
        <button className="youglish-modal__close" onClick={onClose}>
          &times;
        </button>
        <div className="youglish-modal__word">{word}</div>
        {error ? (
          <div className="youglish-modal__error">
            <p>{error}</p>
            <a
              href={`https://youglish.com/pronounce/${encodeURIComponent(word)}/english`}
              target="_blank"
              rel="noopener noreferrer"
              className="youglish-modal__link"
            >
              Open YouGlish
            </a>
          </div>
        ) : (
          <div id="yg-widget" ref={containerRef} className="youglish-modal__widget" />
        )}
      </div>
    </div>
  )
}
