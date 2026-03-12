import { useState } from 'react'
import { hapticFeedback } from '../lib/telegram'
import type { StudyCard } from '../lib/types'

interface Props {
  card: StudyCard
  onReveal: () => void
}

export function FlashCard({ card, onReveal }: Props) {
  const [flipped, setFlipped] = useState(false)

  const handleFlip = () => {
    if (flipped) return
    setFlipped(true)
    hapticFeedback('light')
    onReveal()
  }

  return (
    <div
      className="w-full max-w-sm mx-auto cursor-pointer"
      style={{ perspective: '1000px', minHeight: '280px' }}
      onClick={handleFlip}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
          minHeight: '280px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6"
          style={{
            backfaceVisibility: 'hidden',
            background: 'var(--app-bg-elevated)',
            border: '1px solid var(--app-border)',
          }}
        >
          <span className="text-3xl font-bold text-center" style={{ color: 'var(--app-text)' }}>
            {card.card.front}
          </span>
          {card.card.phonetics && (
            <span className="mt-2 text-base" style={{ color: 'var(--app-text-secondary)' }}>
              {card.card.phonetics}
            </span>
          )}
          {card.card.part_of_speech && (
            <span className="mt-1 text-sm italic" style={{ color: 'var(--app-text-secondary)' }}>
              {card.card.part_of_speech}
            </span>
          )}
          {card.isNew && (
            <span
              className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--app-accent)',
                background: 'var(--app-accent-muted)',
              }}
            >
              NEW
            </span>
          )}
          <span className="mt-6 text-sm" style={{ color: 'var(--app-text-secondary)' }}>
            Tap to reveal
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'var(--app-bg-elevated)',
            border: '1px solid var(--app-border)',
          }}
        >
          <span className="text-sm mb-2" style={{ color: 'var(--app-text-secondary)' }}>
            {card.card.front}
            {card.card.phonetics ? ` ${card.card.phonetics}` : ''}
          </span>
          <span className="text-2xl font-bold text-center" style={{ color: 'var(--app-text)' }}>
            {card.card.back}
          </span>
          {card.card.part_of_speech && (
            <span className="mt-2 text-sm italic" style={{ color: 'var(--app-text-secondary)' }}>
              {card.card.part_of_speech}
            </span>
          )}
          {card.card.example && (
            <p className="mt-4 text-sm text-center italic px-2" style={{ color: 'var(--app-text-secondary)' }}>
              "{card.card.example}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function FlashCardReset({ card, onReveal, index }: Props & { index: number }) {
  return <FlashCard key={card.card.id + '-' + index} card={card} onReveal={onReveal} />
}
