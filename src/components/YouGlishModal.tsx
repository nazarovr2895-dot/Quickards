import { useEffect, useRef } from 'react'
import './YouGlishModal.css'

interface Props {
  word: string
  isOpen: boolean
  onClose: () => void
}

let scriptPromise: Promise<void> | null = null

function loadYouGlishScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    ;(window as any).onYouglishAPIReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://youglish.com/public/emb/widget.js'
    script.async = true
    script.charset = 'utf-8'
    script.onerror = () => reject(new Error('Failed to load YouGlish'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export function YouGlishModal({ word, isOpen, onClose }: Props) {
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    loadYouGlishScript().then(() => {
      if (cancelled) return
      const YG = (window as any).YG
      widgetRef.current = new YG.Widget('yg-widget', {
        width: '100%',
        components: 6,
      })
      widgetRef.current.fetch(word, 'english')
    })

    return () => {
      cancelled = true
      if (widgetRef.current) {
        widgetRef.current.close()
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
        <div id="yg-widget" className="youglish-modal__widget" />
      </div>
    </div>
  )
}
