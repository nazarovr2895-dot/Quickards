import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FlashCardReset } from '../components/FlashCard'
import { TypingCard } from '../components/TypingCard'
import { RatingButtons } from '../components/RatingButtons'
import { ProgressBar } from '../components/ProgressBar'
import { StudyComplete } from '../components/StudyComplete'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import { useStudySession } from '../hooks/useStudySession'
import { showBackButton } from '../lib/telegram'
import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import './StudyPage.css'

interface Props {
  userId: number | undefined
}

type StudyMode = 'en-ru' | 'ru-en' | 'typing'

export function StudyPage({ userId }: Props) {
  const { setId } = useParams()
  const navigate = useNavigate()
  const [studyMode, setStudyMode] = useState<StudyMode>('en-ru')
  const [revealed, setRevealed] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)

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
    undo,
    canUndo,
    accuracy,
  } = useStudySession(userId, setId)

  // Reset revealed/hint state when card changes
  useEffect(() => {
    setRevealed(false)
    setHintUsed(false)
  }, [currentIndex])

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  const handleReveal = useCallback(() => {
    setRevealed(true)
  }, [])

  const handleRate = useCallback((rating: Grade) => {
    rate(rating)
  }, [rate])

  const handleSwipe = useCallback((rating: Grade) => {
    if (!revealed) return
    rate(rating)
  }, [revealed, rate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!revealed) setRevealed(true)
      }
      if (revealed && !finished) {
        if (e.key === '1') handleRate(Rating.Again)
        else if (e.key === '2') handleRate(Rating.Hard)
        else if (e.key === '3') handleRate(Rating.Good)
        else if (e.key === '4') handleRate(Rating.Easy)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [revealed, finished, canUndo, handleRate, undo])

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

      <div className="study-page__mode-selector">
        <button
          className={`study-page__mode-btn ${studyMode === 'en-ru' ? 'study-page__mode-btn--active' : ''}`}
          onClick={() => setStudyMode('en-ru')}
        >
          EN → RU
        </button>
        <button
          className={`study-page__mode-btn ${studyMode === 'ru-en' ? 'study-page__mode-btn--active' : ''}`}
          onClick={() => setStudyMode('ru-en')}
        >
          RU → EN
        </button>
        <button
          className={`study-page__mode-btn ${studyMode === 'typing' ? 'study-page__mode-btn--active' : ''}`}
          onClick={() => setStudyMode('typing')}
        >
          Type
        </button>
      </div>

      {studyMode !== 'typing' && (
        <RatingButtons
          intervals={intervals}
          onRate={handleRate}
          visible={revealed}
          maxRating={hintUsed ? Rating.Hard : undefined}
        />
      )}

      <div className="study-page__card-area">
        {studyMode === 'typing' ? (
          <TypingCard
            key={currentCard.card.id + '-' + currentIndex}
            card={currentCard}
            onRate={handleRate}
          />
        ) : (
          <FlashCardReset
            card={currentCard}
            onReveal={handleReveal}
            onSwipe={handleSwipe}
            onHintUsed={() => setHintUsed(true)}
            index={currentIndex}
            mode={studyMode}
          />
        )}
      </div>

      {canUndo ? (
        <button className="study-page__undo-btn" onClick={undo}>
          Undo
        </button>
      ) : revealed ? (
        <p className="study-page__swipe-hint">
          <span className="study-page__swipe-hint-left">&larr; Again</span>
          <span className="study-page__swipe-hint-right">Know &rarr;</span>
        </p>
      ) : (
        <p className="study-page__swipe-hint study-page__swipe-hint--tap">
          Tap card to reveal answer
        </p>
      )}
    </div>
  )
}
