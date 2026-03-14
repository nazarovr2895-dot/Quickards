import { useState, useRef, useEffect } from 'react'
import { hapticFeedback } from '../lib/telegram'
import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import type { StudyCard } from '../lib/types'
import './TypingCard.css'

interface Props {
  card: StudyCard
  onRate: (rating: Grade) => void
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function TypingCard({ card, onRate }: Props) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const answer = card.card.front.toLowerCase().trim()

  useEffect(() => {
    setInput('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [card.card.id])

  const handleSubmit = () => {
    if (!input.trim()) return
    const guess = input.toLowerCase().trim()
    const dist = levenshtein(guess, answer)

    let rating: Grade
    let res: 'correct' | 'close' | 'wrong'

    if (dist === 0) {
      rating = Rating.Good
      res = 'correct'
    } else if (dist <= 2) {
      rating = Rating.Hard
      res = 'close'
    } else {
      rating = Rating.Again
      res = 'wrong'
    }

    setResult(res)
    hapticFeedback(res === 'correct' ? 'light' : 'medium')

    // Auto-advance after showing result
    setTimeout(() => onRate(rating), res === 'correct' ? 800 : 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="typing-card">
      <div className="typing-card__face card-surface">
        {/* Prompt (Russian word) */}
        <span className="typing-card__prompt">{card.card.back}</span>
        {card.card.part_of_speech && (
          <span className="typing-card__pos">{card.card.part_of_speech}</span>
        )}

        {/* Input or Result */}
        {result === null ? (
          <div className="typing-card__input-area">
            <input
              ref={inputRef}
              type="text"
              className="typing-card__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type the English word..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              className="typing-card__submit"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              Check
            </button>
          </div>
        ) : (
          <div className={`typing-card__result typing-card__result--${result}`}>
            {result === 'correct' && (
              <span className="typing-card__result-text">Correct!</span>
            )}
            {result === 'close' && (
              <>
                <span className="typing-card__result-text">Close!</span>
                <span className="typing-card__answer">
                  <span className="typing-card__your">{input}</span>
                  {' → '}
                  <span className="typing-card__correct">{card.card.front}</span>
                </span>
              </>
            )}
            {result === 'wrong' && (
              <>
                <span className="typing-card__result-text">Not quite</span>
                <span className="typing-card__answer">
                  <span className="typing-card__correct">{card.card.front}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
