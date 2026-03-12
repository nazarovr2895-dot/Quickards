import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'
import { f, Rating, Grades, dbCardToFSRS, newFSRSCard, formatInterval } from '../lib/fsrs'
import type { FSRSCard, Grade } from '../lib/fsrs'
import type { DBCard, DBUserCard, StudyCard } from '../lib/types'

interface ReviewResult {
  userCardId: string | null
  cardId: string
  userId: number
  rating: number
  fsrsCard: FSRSCard
  prevState: number
  prevDue: string
  prevStability: number
  prevDifficulty: number
  prevElapsedDays: number
  prevScheduledDays: number
}

type GradeIntervals = Record<number, string>

export function useStudySession(userId: number | undefined, setId?: string) {
  const [queue, setQueue] = useState<StudyCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCards, setTotalCards] = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const [newLearned, setNewLearned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const writeQueue = useRef<ReviewResult[]>([])
  const flushTimer = useRef<ReturnType<typeof setInterval>>(undefined)

  const currentCard = queue[currentIndex] || null

  const intervals: GradeIntervals | null = currentCard
    ? (() => {
        const now = new Date()
        const scheduling = f.repeat(currentCard.fsrsCard, now)
        const result: GradeIntervals = {}
        for (const grade of Grades) {
          result[grade] = formatInterval(scheduling[grade].card.due, now)
        }
        return result
      })()
    : null

  // Load session cards
  const loadCards = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // 1. Get due cards
      const dueUrl = setId
        ? `/api/study/due?set_id=${setId}&limit=50`
        : '/api/study/due?limit=50'
      const dueCards = await apiGet<(DBUserCard & { card: DBCard })[]>(dueUrl)

      const studyCards: StudyCard[] = (dueCards || []).map(uc => ({
        userCard: uc,
        card: uc.card,
        fsrsCard: dbCardToFSRS(uc),
        isNew: false,
      }))

      // 2. Get new cards
      let newCardsData: DBCard[] = []
      if (setId) {
        newCardsData = await apiGet<DBCard[]>(`/api/cards/new?set_id=${setId}&limit=10`)
      } else {
        const userSets = await apiGet<{ set_id: string }[]>('/api/user-sets')
        if (userSets && userSets.length > 0) {
          const setIds = userSets.map(us => us.set_id).join(',')
          newCardsData = await apiGet<DBCard[]>(`/api/cards/new?set_ids=${setIds}&limit=10`)
        }
      }

      const newStudyCards: StudyCard[] = (newCardsData || []).map((card: DBCard) => ({
        userCard: null,
        card,
        fsrsCard: newFSRSCard(),
        isNew: true,
      }))

      // 3. Interleave: after every 5 review cards, insert 1 new card
      const merged: StudyCard[] = []
      let reviewIdx = 0
      let newIdx = 0
      while (reviewIdx < studyCards.length || newIdx < newStudyCards.length) {
        for (let i = 0; i < 5 && reviewIdx < studyCards.length; i++) {
          merged.push(studyCards[reviewIdx++])
        }
        if (newIdx < newStudyCards.length) {
          merged.push(newStudyCards[newIdx++])
        }
      }

      setQueue(merged)
      setTotalCards(merged.length)
      setCurrentIndex(0)
      setReviewed(0)
      setNewLearned(0)
      setFinished(merged.length === 0)
    } finally {
      setLoading(false)
    }
  }, [userId, setId])

  // Flush write queue to backend
  const flush = useCallback(async () => {
    if (writeQueue.current.length === 0) return
    const batch = writeQueue.current.splice(0)

    await apiPost('/api/study/rate', {
      reviews: batch.map(r => ({
        user_card_id: r.userCardId,
        card_id: r.cardId,
        rating: r.rating,
        card_state: {
          due: r.fsrsCard.due.toISOString(),
          stability: r.fsrsCard.stability,
          difficulty: r.fsrsCard.difficulty,
          elapsed_days: r.fsrsCard.elapsed_days,
          scheduled_days: r.fsrsCard.scheduled_days,
          reps: r.fsrsCard.reps,
          lapses: r.fsrsCard.lapses,
          learning_steps: r.fsrsCard.learning_steps,
          state: r.fsrsCard.state,
          last_review: r.fsrsCard.last_review?.toISOString() || null,
        },
        prev_state: r.prevState,
        prev_due: r.prevDue,
        prev_stability: r.prevStability,
        prev_difficulty: r.prevDifficulty,
        prev_elapsed_days: r.prevElapsedDays,
        prev_scheduled_days: r.prevScheduledDays,
      })),
    })
  }, [])

  // Rate a card
  const rate = useCallback((rating: Grade) => {
    if (!currentCard || !userId) return

    const now = new Date()
    const scheduling = f.repeat(currentCard.fsrsCard, now)
    const result = scheduling[rating]
    const updatedFsrsCard = result.card

    writeQueue.current.push({
      userCardId: currentCard.userCard?.id || null,
      cardId: currentCard.card.id,
      userId,
      rating,
      fsrsCard: updatedFsrsCard,
      prevState: currentCard.fsrsCard.state,
      prevDue: currentCard.fsrsCard.due.toISOString(),
      prevStability: currentCard.fsrsCard.stability,
      prevDifficulty: currentCard.fsrsCard.difficulty,
      prevElapsedDays: currentCard.fsrsCard.elapsed_days,
      prevScheduledDays: currentCard.fsrsCard.scheduled_days,
    })

    setReviewed(r => r + 1)
    if (currentCard.isNew) setNewLearned(n => n + 1)

    if (rating === Rating.Again) {
      setQueue(q => {
        const updated = [...q]
        updated.push({
          ...currentCard,
          fsrsCard: updatedFsrsCard,
          userCard: currentCard.userCard
            ? { ...currentCard.userCard, id: currentCard.userCard.id }
            : null,
          isNew: false,
        })
        return updated
      })
    }

    if (currentIndex + 1 >= queue.length && rating !== Rating.Again) {
      flush()
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }, [currentCard, currentIndex, queue.length, userId, flush])

  // Set up flush timer
  useEffect(() => {
    flushTimer.current = setInterval(flush, 5000)
    return () => {
      clearInterval(flushTimer.current)
      flush()
    }
  }, [flush])

  // Load on mount
  useEffect(() => { loadCards() }, [loadCards])

  return {
    currentCard,
    currentIndex,
    totalCards,
    reviewed,
    newLearned,
    loading,
    finished,
    intervals,
    rate,
  }
}
