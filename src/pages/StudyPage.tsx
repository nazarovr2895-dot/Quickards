import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FlashCardReset } from '../components/FlashCard'
import { RatingButtons } from '../components/RatingButtons'
import { ProgressBar } from '../components/ProgressBar'
import { StudyComplete } from '../components/StudyComplete'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import { useStudySession } from '../hooks/useStudySession'
import { showBackButton } from '../lib/telegram'
import type { Grade } from '../lib/fsrs'

interface Props {
  userId: number | undefined
}

export function StudyPage({ userId }: Props) {
  const { setId } = useParams()
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)

  const {
    currentCard,
    currentIndex,
    totalCards,
    reviewed,
    newLearned,
    loading,
    finished,
    intervals,
    rate,
  } = useStudySession(userId, setId)

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  const handleRate = (rating: Grade) => {
    setRevealed(false)
    rate(rating)
  }

  if (loading) return <LoadingSpinner />

  if (finished && reviewed > 0) {
    return <StudyComplete reviewed={reviewed} newLearned={newLearned} />
  }

  if (!currentCard) {
    return (
      <EmptyState
        icon="&#127775;"
        title="All caught up!"
        description="No cards to review right now. Come back later or add new sets."
      />
    )
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <ProgressBar current={reviewed} total={totalCards} />

      <div className="flex-1 flex items-center justify-center px-1">
        <FlashCardReset
          card={currentCard}
          onReveal={() => setRevealed(true)}
          index={currentIndex}
        />
      </div>

      <div className="pb-4">
        <RatingButtons
          intervals={intervals}
          onRate={handleRate}
          visible={revealed}
        />
        {!revealed && (
          <p
            className="text-center text-sm mt-4 font-medium"
            style={{
              color: 'var(--app-text-secondary)',
              animation: 'pulse-subtle 2s ease-in-out infinite',
            }}
          >
            Tap the card to see the answer
          </p>
        )}
      </div>
    </div>
  )
}
