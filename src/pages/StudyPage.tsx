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
import './StudyPage.css'

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
    accuracy,
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
    return <StudyComplete reviewed={reviewed} newLearned={newLearned} accuracy={accuracy} />
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
    <div className="study-page">
      <ProgressBar current={reviewed} total={totalCards} />

      <div className="study-page__card-area">
        <FlashCardReset
          card={currentCard}
          onReveal={() => setRevealed(true)}
          index={currentIndex}
        />
      </div>

      <div className="study-page__actions">
        <RatingButtons
          intervals={intervals}
          onRate={handleRate}
          visible={revealed}
        />
        {!revealed && (
          <p className="study-page__hint">
            Tap the card to see the answer
          </p>
        )}
      </div>
    </div>
  )
}
