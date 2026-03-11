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
      className="w-full max-w-sm mx-auto perspective-[1000px] cursor-pointer"
      style={{ minHeight: '280px' }}
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
          className="absolute inset-0 flex flex-col items-center justify-center bg-tg-section-bg rounded-2xl p-6 shadow-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-3xl font-bold text-tg-text text-center">
            {card.card.front}
          </span>
          {card.card.phonetics && (
            <span className="mt-2 text-base text-tg-hint">
              {card.card.phonetics}
            </span>
          )}
          {card.card.part_of_speech && (
            <span className="mt-1 text-sm text-tg-subtitle italic">
              {card.card.part_of_speech}
            </span>
          )}
          {card.isNew && (
            <span className="absolute top-4 right-4 text-xs font-semibold text-tg-accent bg-tg-accent/10 px-2 py-0.5 rounded-full">
              NEW
            </span>
          )}
          <span className="mt-6 text-sm text-tg-hint">
            Tap to reveal
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-tg-section-bg rounded-2xl p-6 shadow-sm"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="text-sm text-tg-hint mb-2">
            {card.card.front}
            {card.card.phonetics ? ` ${card.card.phonetics}` : ''}
          </span>
          <span className="text-2xl font-bold text-tg-text text-center">
            {card.card.back}
          </span>
          {card.card.part_of_speech && (
            <span className="mt-2 text-sm text-tg-subtitle italic">
              {card.card.part_of_speech}
            </span>
          )}
          {card.card.example && (
            <p className="mt-4 text-sm text-tg-hint text-center italic px-2">
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
