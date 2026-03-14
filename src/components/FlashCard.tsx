import { useState, useRef, useCallback } from 'react'
import { hapticFeedback, openLink } from '../lib/telegram'
import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import type { StudyCard } from '../lib/types'
import './FlashCard.css'

interface Props {
  card: StudyCard
  onReveal: () => void
  onSwipe?: (rating: Grade) => void
  onHintUsed?: () => void
  mode?: 'en-ru' | 'ru-en'
}

const SWIPE_THRESHOLD = 80
const SWIPE_LONG_THRESHOLD = 150

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

function speakWord(word: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function FlashCard({ card, onReveal, onSwipe, onHintUsed, mode = 'en-ru' }: Props) {
  const [state, setState] = useState(0)
  const [displayState, setDisplayState] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const [hintLevel, setHintLevel] = useState(0)

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

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    speakWord(card.card.front)
  }

  const handleHint = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hintLevel < 2) setHintLevel(h => h + 1)
    onHintUsed?.()
    hapticFeedback('light')
  }

  // Generate hint text based on the answer word
  const answerWord = mode === 'ru-en' ? card.card.front : card.card.back
  const hintText = hintLevel >= 1
    ? `${answerWord[0]}${'_'.repeat(answerWord.length - 1)} (${answerWord.length} letters)`
    : null

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
      // 4-level rating: short right=Good, long right=Easy, short left=Hard, long left=Again
      let rating: Grade
      if (dragX > 0) {
        rating = Math.abs(dragX) >= SWIPE_LONG_THRESHOLD ? Rating.Easy : Rating.Good
      } else {
        rating = Math.abs(dragX) >= SWIPE_LONG_THRESHOLD ? Rating.Again : Rating.Hard
      }
      const direction = dragX > 0 ? 'right' : 'left'
      hapticFeedback('medium')
      setExiting(direction)
      setTimeout(() => {
        onSwipe(rating)
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
  const isLongSwipe = Math.abs(dragX) >= SWIPE_LONG_THRESHOLD

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
      {/* Swipe overlays — 4-level */}
      {showRight && (
        <div className={`flash-card__swipe-overlay ${isLongSwipe ? 'flash-card__swipe-overlay--easy' : 'flash-card__swipe-overlay--right'}`} style={{ opacity: overlayOpacity }}>
          <span className={`flash-card__swipe-label ${isLongSwipe ? 'flash-card__swipe-label--easy' : 'flash-card__swipe-label--right'}`}>
            {isLongSwipe ? 'EASY' : 'GOOD'}
          </span>
        </div>
      )}
      {showLeft && (
        <div className={`flash-card__swipe-overlay ${isLongSwipe ? 'flash-card__swipe-overlay--left' : 'flash-card__swipe-overlay--hard'}`} style={{ opacity: overlayOpacity }}>
          <span className={`flash-card__swipe-label ${isLongSwipe ? 'flash-card__swipe-label--left' : 'flash-card__swipe-label--hard'}`}>
            {isLongSwipe ? 'AGAIN' : 'HARD'}
          </span>
        </div>
      )}

      {/* Action buttons — outside inner */}
      <div className="flash-card__top-actions">
        {'speechSynthesis' in window && (
          <button
            className="flash-card__action-btn"
            onClick={handleSpeak}
            aria-label="Pronounce word"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          </button>
        )}
        <button
          className="flash-card__action-btn"
          onClick={handleYouGlish}
          aria-label="Hear in context"
        >
          YouGlish
        </button>
      </div>

      {/* Hint button — only on question state */}
      {displayState === 0 && hintLevel < 2 && (
        <button
          className="flash-card__action-btn flash-card__hint-btn"
          onClick={handleHint}
          aria-label="Get a hint"
        >
          Hint
        </button>
      )}

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
              {card.card.part_of_speech && hintLevel >= 2 && (
                <span className="flash-card__pos">{card.card.part_of_speech}</span>
              )}
              {hintText && (
                <span className="flash-card__hint-text">{hintText}</span>
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

export function FlashCardReset({ card, onReveal, onSwipe, onHintUsed, index, mode }: Props & { index: number }) {
  return <FlashCard key={card.card.id + '-' + index} card={card} onReveal={onReveal} onSwipe={onSwipe} onHintUsed={onHintUsed} mode={mode} />
}
