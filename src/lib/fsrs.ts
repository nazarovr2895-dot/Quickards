import { createEmptyCard, fsrs, type Card as FSRSCard, type Grade, Rating, State, Grades } from 'ts-fsrs'
import type { DBUserCard } from './types'

export const f = fsrs()

export { Rating, State, Grades }
export type { FSRSCard, Grade }

export function dbCardToFSRS(uc: DBUserCard): FSRSCard {
  return {
    due: new Date(uc.due),
    stability: uc.stability,
    difficulty: uc.difficulty,
    elapsed_days: uc.elapsed_days,
    scheduled_days: uc.scheduled_days,
    reps: uc.reps,
    lapses: uc.lapses,
    learning_steps: uc.learning_steps,
    state: uc.state as State,
    last_review: uc.last_review ? new Date(uc.last_review) : undefined,
  }
}

export function newFSRSCard(): FSRSCard {
  return createEmptyCard(new Date())
}

export function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)
  const diffHour = Math.round(diffMs / 3600000)
  const diffDay = Math.round(diffMs / 86400000)

  if (diffMin < 1) return '<1m'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 30) return `${diffDay}d`
  const diffMonth = Math.round(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth}mo`
  return `${Math.round(diffDay / 365)}y`
}
