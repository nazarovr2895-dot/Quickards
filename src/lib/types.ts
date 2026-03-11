import type { Card as FSRSCard, State } from 'ts-fsrs'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface DBUser {
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
  language_code: string | null
  created_at: string
}

export interface DBSet {
  id: string
  owner_id: number | null
  name: string
  description: string | null
  cefr_level: string | null
  source: string | null
  card_count: number
  is_system: boolean
  created_at: string
}

export interface DBCard {
  id: string
  set_id: string
  front: string
  back: string
  part_of_speech: string | null
  phonetics: string | null
  example: string | null
  created_at: string
}

export interface DBUserCard {
  id: string
  user_id: number
  card_id: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  learning_steps: number
  state: State
  last_review: string | null
  card?: DBCard
}

export interface DBReviewLog {
  user_card_id: string
  rating: number
  state: State
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
}

export interface DBUserSet {
  user_id: number
  set_id: string
  added_at: string
  sets?: DBSet
}

export interface StudyCard {
  userCard: DBUserCard | null
  card: DBCard
  fsrsCard: FSRSCard
  isNew: boolean
}

export interface StudyStats {
  dueToday: number
  newAvailable: number
  totalReviewed: number
  streak: number
}
