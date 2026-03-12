import { useState } from 'react'
import { hapticFeedback } from '../lib/telegram'
import type { StudyCard } from '../lib/types'
import './FlashCard.css'

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
    <div className="flash-card" onClick={handleFlip}>
      <div className={`flash-card__inner ${flipped ? 'flash-card__inner--flipped' : ''}`}>
        {/* Front */}
        <div className="flash-card__face flash-card__face--front">
          <span className="flash-card__word">{card.card.front}</span>
          {card.card.phonetics && (
            <span className="flash-card__phonetics">{card.card.phonetics}</span>
          )}
          {card.card.part_of_speech && (
            <span className="flash-card__pos">{card.card.part_of_speech}</span>
          )}
          {card.isNew && (
            <span className="flash-card__badge">NEW</span>
          )}
          <span className="flash-card__hint">Tap to reveal</span>
        </div>

        {/* Back */}
        <div className="flash-card__face flash-card__face--back">
          <span className="flash-card__back-word">
            {card.card.front}
            {card.card.phonetics ? ` ${card.card.phonetics}` : ''}
          </span>
          <span className="flash-card__translation">{card.card.back}</span>
          {card.card.part_of_speech && (
            <span className="flash-card__pos">{card.card.part_of_speech}</span>
          )}
          {card.card.example && (
            <p className="flash-card__example">"{card.card.example}"</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function FlashCardReset({ card, onReveal, index }: Props & { index: number }) {
  return <FlashCard key={card.card.id + '-' + index} card={card} onReveal={onReveal} />
}
