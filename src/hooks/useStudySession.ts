import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
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
    if (!userId) return
    setLoading(true)

    // 1. Get due cards (for review)
    let dueQuery = supabase
      .from('user_cards')
      .select('*, card:cards(*)')
      .eq('user_id', userId)
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(50)

    if (setId) {
      const { data: setCards } = await supabase
        .from('cards')
        .select('id')
        .eq('set_id', setId)
      if (setCards) {
        dueQuery = dueQuery.in('card_id', setCards.map(c => c.id))
      }
    }

    const { data: dueCards } = await dueQuery

    const studyCards: StudyCard[] = (dueCards || []).map((uc: DBUserCard & { card: DBCard }) => ({
      userCard: uc,
      card: uc.card,
      fsrsCard: dbCardToFSRS(uc),
      isNew: false,
    }))

    // 2. Get new cards (not yet studied)
    const newCardsLimit = 10
    let newCardsData: DBCard[] | null = null

    if (setId) {
      const { data } = await supabase.rpc('get_new_cards', {
        p_set_id: setId,
        p_limit: newCardsLimit,
      })
      newCardsData = data
    } else {
      const { data: userSets } = await supabase
        .from('user_sets')
        .select('set_id')
        .eq('user_id', userId)

      if (userSets && userSets.length > 0) {
        const setIds = userSets.map(us => us.set_id)
        const { data: existingCardIds } = await supabase
          .from('user_cards')
          .select('card_id')
          .eq('user_id', userId)

        const excludeIds = (existingCardIds || []).map(e => e.card_id)

        let q = supabase
          .from('cards')
          .select('*')
          .in('set_id', setIds)
          .limit(newCardsLimit)

        if (excludeIds.length > 0) {
          q = q.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { data } = await q
        newCardsData = data
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
    setLoading(false)
  }, [userId, setId])

  // Flush write queue to database
  const flush = useCallback(async () => {
    if (writeQueue.current.length === 0) return
    const batch = writeQueue.current.splice(0)

    for (const r of batch) {
      const card = r.fsrsCard

      if (r.userCardId) {
        await supabase.from('user_cards').update({
          due: card.due.toISOString(),
          stability: card.stability,
          difficulty: card.difficulty,
          elapsed_days: card.elapsed_days,
          scheduled_days: card.scheduled_days,
          reps: card.reps,
          lapses: card.lapses,
          learning_steps: card.learning_steps,
          state: card.state,
          last_review: card.last_review?.toISOString() || null,
        }).eq('id', r.userCardId)

        await supabase.from('review_logs').insert({
          user_card_id: r.userCardId,
          rating: r.rating,
          state: r.prevState,
          due: r.prevDue,
          stability: r.prevStability,
          difficulty: r.prevDifficulty,
          elapsed_days: r.prevElapsedDays,
          scheduled_days: r.prevScheduledDays,
        })
      } else {
        const { data } = await supabase.from('user_cards').insert({
          user_id: r.userId,
          card_id: r.cardId,
          due: card.due.toISOString(),
          stability: card.stability,
          difficulty: card.difficulty,
          elapsed_days: card.elapsed_days,
          scheduled_days: card.scheduled_days,
          reps: card.reps,
          lapses: card.lapses,
          learning_steps: card.learning_steps,
          state: card.state,
          last_review: card.last_review?.toISOString() || null,
        }).select('id').single()

        if (data) {
          await supabase.from('review_logs').insert({
            user_card_id: data.id,
            rating: r.rating,
            state: r.prevState,
            due: r.prevDue,
            stability: r.prevStability,
            difficulty: r.prevDifficulty,
            elapsed_days: r.prevElapsedDays,
            scheduled_days: r.prevScheduledDays,
          })
        }
      }
    }
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
