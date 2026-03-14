import { describe, it, expect } from 'vitest'
import { dbCardToFSRS, newFSRSCard, formatInterval } from './fsrs'
import type { DBUserCard } from './types'

describe('newFSRSCard', () => {
  it('creates a card with default FSRS state', () => {
    const card = newFSRSCard()
    expect(card.reps).toBe(0)
    expect(card.lapses).toBe(0)
    expect(card.state).toBe(0) // State.New
    expect(card.stability).toBe(0)
    expect(card.difficulty).toBe(0)
    expect(card.due).toBeInstanceOf(Date)
  })
})

describe('dbCardToFSRS', () => {
  it('converts DB user card to FSRS card', () => {
    const uc = {
      due: '2025-06-01T00:00:00.000Z',
      stability: 5.5,
      difficulty: 3.2,
      elapsed_days: 2,
      scheduled_days: 5,
      reps: 3,
      lapses: 1,
      learning_steps: 0,
      state: 2,
      last_review: '2025-05-27T12:00:00.000Z',
    } as unknown as DBUserCard

    const card = dbCardToFSRS(uc)
    expect(card.stability).toBe(5.5)
    expect(card.difficulty).toBe(3.2)
    expect(card.reps).toBe(3)
    expect(card.lapses).toBe(1)
    expect(card.state).toBe(2)
    expect(card.due).toBeInstanceOf(Date)
    expect(card.last_review).toBeInstanceOf(Date)
  })

  it('handles null last_review', () => {
    const uc = {
      due: '2025-06-01T00:00:00.000Z',
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      learning_steps: 0,
      state: 0,
      last_review: null,
    } as unknown as DBUserCard

    const card = dbCardToFSRS(uc)
    expect(card.last_review).toBeUndefined()
  })
})

describe('formatInterval', () => {
  const now = new Date('2025-06-01T12:00:00Z')

  it('returns <1m for very short intervals', () => {
    const due = new Date(now.getTime() + 20_000) // 20 seconds (rounds to 0 min)
    expect(formatInterval(due, now)).toBe('<1m')
  })

  it('returns minutes for short intervals', () => {
    const due = new Date(now.getTime() + 15 * 60_000) // 15 minutes
    expect(formatInterval(due, now)).toBe('15m')
  })

  it('returns hours for medium intervals', () => {
    const due = new Date(now.getTime() + 6 * 3_600_000) // 6 hours
    expect(formatInterval(due, now)).toBe('6h')
  })

  it('returns days for longer intervals', () => {
    const due = new Date(now.getTime() + 5 * 86_400_000) // 5 days
    expect(formatInterval(due, now)).toBe('5d')
  })

  it('returns months for long intervals', () => {
    const due = new Date(now.getTime() + 60 * 86_400_000) // ~2 months
    expect(formatInterval(due, now)).toBe('2mo')
  })

  it('returns years for very long intervals', () => {
    const due = new Date(now.getTime() + 400 * 86_400_000) // ~1.1 years
    expect(formatInterval(due, now)).toBe('1y')
  })
})
