import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import { hapticFeedback } from '../lib/telegram'

interface Props {
  intervals: Record<number, string> | null
  onRate: (rating: Grade) => void
  visible: boolean
}

const buttons: { rating: Grade; label: string; bg: string; text: string }[] = [
  { rating: Rating.Again, label: 'Again', bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  { rating: Rating.Hard, label: 'Hard', bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
  { rating: Rating.Good, label: 'Good', bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  { rating: Rating.Easy, label: 'Easy', bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
]

export function RatingButtons({ intervals, onRate, visible }: Props) {
  if (!visible || !intervals) return null

  const handleRate = (rating: Grade) => {
    hapticFeedback('medium')
    onRate(rating)
  }

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
      {buttons.map(({ rating, label, bg, text }) => (
        <button
          key={rating}
          onClick={() => handleRate(rating)}
          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl font-medium transition-opacity active:opacity-70"
          style={{
            background: bg,
            color: text,
            border: '1px solid transparent',
          }}
        >
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs opacity-75">{intervals[rating]}</span>
        </button>
      ))}
    </div>
  )
}
