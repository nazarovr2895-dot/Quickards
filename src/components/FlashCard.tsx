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

export function FlashCard({ card, onReveal, onSwipe, mode = 'en-ru' }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)

  const startX = useRef(0)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const isVertical = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleFlip = () => {
    if (isDragging.current) return
    setFlipped(f => !f)
    hapticFeedback('light')
    if (!flipped) onReveal()
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

    // On first significant movement, determine direction lock
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
      // Wait for fly-off animation, then fire callback
      setTimeout(() => {
        onSwipe(direction)
      }, 250)
    } else {
      // Snap back
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
      e.preventDefault() // prevent scroll while swiping horizontally
    }
    onDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }
  const handleTouchEnd = () => onDragEnd()

  // Mouse handlers (for desktop testing)
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

  const youglishBtn = (
    <button
      className="flash-card__youglish-btn"
      onClick={handleYouGlish}
      aria-label="Hear in context"
    >
      YouGlish
    </button>
  )

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

      <div className={`flash-card__inner ${flipped ? 'flash-card__inner--flipped' : ''}`}>
        {/* Front */}
        <div className="flash-card__face flash-card__face--front">
          <span className="flash-card__word">
            {mode === 'ru-en' ? card.card.back : card.card.front}
          </span>
          {mode === 'en-ru' && card.card.phonetics && (
            <span className="flash-card__phonetics">{card.card.phonetics}</span>
          )}
          {card.card.part_of_speech && (
            <span className="flash-card__pos">{card.card.part_of_speech}</span>
          )}
          {card.isNew && (
            <span className="flash-card__badge">NEW</span>
          )}
          <span className="flash-card__hint">Tap to flip</span>
          {youglishBtn}
        </div>

        {/* Back */}
        <div className="flash-card__face flash-card__face--back">
          <span className="flash-card__back-word">
            {mode === 'ru-en' ? card.card.back : card.card.front}
            {mode === 'en-ru' && card.card.phonetics ? ` ${card.card.phonetics}` : ''}
          </span>
          <span className="flash-card__translation">
            {mode === 'ru-en' ? card.card.front : card.card.back}
          </span>
          {mode === 'ru-en' && card.card.phonetics && (
            <span className="flash-card__phonetics">{card.card.phonetics}</span>
          )}
          {card.card.part_of_speech && (
            <span className="flash-card__pos">{card.card.part_of_speech}</span>
          )}
          {card.card.example && (
            <p className="flash-card__example">"{card.card.example}"</p>
          )}
          {youglishBtn}
        </div>
      </div>
    </div>
  )
}

export function FlashCardReset({ card, onReveal, onSwipe, index, mode }: Props & { index: number }) {
  return <FlashCard key={card.card.id + '-' + index} card={card} onReveal={onReveal} onSwipe={onSwipe} mode={mode} />
}
