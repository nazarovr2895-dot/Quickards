import { useState, useRef, useCallback } from 'react'
import { hapticFeedback, openLink } from '../lib/telegram'
import type { StudyCard } from '../lib/types'
import './FlashCard.css'

interface Props {
  card: StudyCard
  onReveal: () => void
  onSwipe?: (direction: 'left' | 'right') => void
  mode?: 'en-ru' | 'ru-en'
}

const SWIPE_THRESHOLD = 80

function youglishUrl(word: string) {
  return `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function blankExample(example: string, word: string): string {
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  return regex.test(example) ? example.replace(regex, '______') : example
}

function highlightWord(example: string, word: string): React.ReactNode {
  const regex = new RegExp(`(\\b${escapeRegex(word)}\\b)`, 'i')
  const parts = example.split(regex)
  if (parts.length === 1) return example
  return parts.map((part, i) =>
    regex.test(part) ? <strong key={i} className="flash-card__highlight">{part}</strong> : part
  )
}

export function FlashCard({ card, onReveal, onSwipe, mode = 'en-ru' }: Props) {
  const [state, setState] = useState(0)
  const [displayState, setDisplayState] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)

  const startX = useRef(0)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const isVertical = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const hasExample = !!card.card.example

  const handleFlip = () => {
    if (isDragging.current || flipping) return
    const next = (state + 1) % 3
    setState(next)
    setFlipping(true)
    hapticFeedback('light')
    if (state === 0) onReveal()

    // Swap content at animation midpoint
    setTimeout(() => setDisplayState(next), 150)
    // Animation complete
    setTimeout(() => setFlipping(false), 300)
  }

  const handleYouGlish = (e: React.MouseEvent) => {
    e.stopPropagation()
    openLink(youglishUrl(card.card.front))
  }

  const onDragStart = useCallback((clientX: number, clientY: number) => {
    if (!onSwipe || exiting) return
    startX.current = clientX
    startY.current = clientY
    isDragging.current = false
    isVertical.current = false
    setSwiping(true)
  }, [onSwipe, exiting])

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!swiping || exiting) return
    const dx = clientX - startX.current
    const dy = clientY - startY.current

    if (!isDragging.current && !isVertical.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        isVertical.current = true
        setSwiping(false)
        return
      }
      if (Math.abs(dx) > 10) {
        isDragging.current = true
      }
    }

    if (isDragging.current) {
      setDragX(dx)
    }
  }, [swiping, exiting])

  const onDragEnd = useCallback(() => {
    if (!isDragging.current) {
      setSwiping(false)
      setDragX(0)
      return
    }

    if (Math.abs(dragX) >= SWIPE_THRESHOLD && onSwipe) {
      const direction = dragX > 0 ? 'right' : 'left'
      hapticFeedback('medium')
      setExiting(direction)
      setTimeout(() => {
        onSwipe(direction)
      }, 250)
    } else {
      setDragX(0)
    }

    isDragging.current = false
    setSwiping(false)
  }, [dragX, onSwipe])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    onDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) {
      e.preventDefault()
    }
    onDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }
  const handleTouchEnd = () => onDragEnd()

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(e.clientX, e.clientY)
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (swiping) onDragMove(e.clientX, e.clientY)
  }
  const handleMouseUp = () => {
    if (swiping) onDragEnd()
  }
  const handleMouseLeave = () => {
    if (swiping) onDragEnd()
  }

  const rotation = isDragging.current ? dragX * 0.06 : 0
  const overlayOpacity = Math.min(Math.abs(dragX) / 150, 0.35)
  const showRight = dragX > 20
  const showLeft = dragX < -20

  const cardStyle = exiting
    ? {
        transform: `translateX(${exiting === 'right' ? '120%' : '-120%'}) rotate(${exiting === 'right' ? 15 : -15}deg)`,
        transition: 'transform 0.25s ease-out',
        opacity: 0.7,
      }
    : isDragging.current
      ? {
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition: 'none',
        }
      : {
          transform: 'translateX(0) rotate(0)',
          transition: 'transform 0.3s ease-out',
        }

  // Dynamic border color based on display state
  const borderColor = displayState === 1
    ? 'var(--app-accent-secondary)'
    : 'var(--app-accent)'

  return (
    <div
      ref={cardRef}
      className="flash-card"
      onClick={handleFlip}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
    >
      {/* Swipe overlays */}
      {showRight && (
        <div className="flash-card__swipe-overlay flash-card__swipe-overlay--right" style={{ opacity: overlayOpacity }}>
          <span className="flash-card__swipe-label flash-card__swipe-label--right">KNOW</span>
        </div>
      )}
      {showLeft && (
        <div className="flash-card__swipe-overlay flash-card__swipe-overlay--left" style={{ opacity: overlayOpacity }}>
          <span className="flash-card__swipe-label flash-card__swipe-label--left">AGAIN</span>
        </div>
      )}

      {/* YouGlish — outside inner */}
      <button
        className="flash-card__youglish-btn"
        onClick={handleYouGlish}
        aria-label="Hear in context"
      >
        YouGlish
      </button>

      {/* NEW badge */}
      {card.isNew && displayState === 0 && (
        <span className="flash-card__badge">NEW</span>
      )}

      <div className={`flash-card__inner${flipping ? ' flash-card__inner--flipping' : ''}`}>
        <div className="flash-card__face" style={{ borderTopColor: borderColor }}>

          {/* State 0: Question */}
          {displayState === 0 && (
            <>
              <span className="flash-card__word">
                {mode === 'ru-en' ? card.card.back : card.card.front}
              </span>
              {mode === 'en-ru' && card.card.phonetics && (
                <span className="flash-card__phonetics">{card.card.phonetics}</span>
              )}
              {card.card.part_of_speech && (
                <span className="flash-card__pos">{card.card.part_of_speech}</span>
              )}
              {mode === 'ru-en' && hasExample && (
                <p className="flash-card__example flash-card__example--blank">
                  {blankExample(card.card.example!, card.card.front)}
                </p>
              )}
            </>
          )}

          {/* State 1: Answer */}
          {displayState === 1 && (
            <>
              <span className="flash-card__translation">
                {mode === 'ru-en' ? card.card.front : card.card.back}
              </span>
              {mode === 'ru-en' && card.card.phonetics && (
                <span className="flash-card__phonetics">{card.card.phonetics}</span>
              )}
              {card.card.part_of_speech && (
                <span className="flash-card__pos">{card.card.part_of_speech}</span>
              )}
              {hasExample && (
                <p className="flash-card__example flash-card__example--blank">
                  {blankExample(card.card.example!, card.card.front)}
                </p>
              )}
            </>
          )}

          {/* State 2: Context */}
          {displayState === 2 && (
            <>
              <span className="flash-card__word flash-card__word--small">
                {mode === 'ru-en' ? card.card.back : card.card.front}
                {mode === 'en-ru' && card.card.phonetics ? ` ${card.card.phonetics}` : ''}
              </span>
              {hasExample && (
                <p className="flash-card__example flash-card__example--filled">
                  {highlightWord(card.card.example!, card.card.front)}
                </p>
              )}
              {card.card.example_translation && (
                <p className="flash-card__example-translation">
                  {card.card.example_translation}
                </p>
              )}
            </>
          )}

        </div>
      </div>

      {/* State dots */}
      <div className="flash-card__dots">
        <span className={`flash-card__dot${displayState === 0 ? ' flash-card__dot--active' : ''}`} />
        <span className={`flash-card__dot${displayState === 1 ? ' flash-card__dot--active' : ''}`} />
        <span className={`flash-card__dot${displayState === 2 ? ' flash-card__dot--active' : ''}`} />
      </div>
    </div>
  )
}

export function FlashCardReset({ card, onReveal, onSwipe, index, mode }: Props & { index: number }) {
  return <FlashCard key={card.card.id + '-' + index} card={card} onReveal={onReveal} onSwipe={onSwipe} mode={mode} />
}
