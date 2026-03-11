import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import { hapticFeedback } from '../lib/telegram'

interface Props {
  intervals: Record<number, string> | null
  onRate: (rating: Grade) => void
  visible: boolean
}

const buttons: { rating: Grade; label: string; color: string }[] = [
  { rating: Rating.Again, label: 'Again', color: 'bg-red-500/15 text-red-600 active:bg-red-500/30' },
  { rating: Rating.Hard, label: 'Hard', color: 'bg-orange-500/15 text-orange-600 active:bg-orange-500/30' },
  { rating: Rating.Good, label: 'Good', color: 'bg-green-500/15 text-green-600 active:bg-green-500/30' },
  { rating: Rating.Easy, label: 'Easy', color: 'bg-blue-500/15 text-blue-600 active:bg-blue-500/30' },
]

export function RatingButtons({ intervals, onRate, visible }: Props) {
  if (!visible || !intervals) return null

  const handleRate = (rating: Grade) => {
    hapticFeedback('medium')
    onRate(rating)
  }

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
      {buttons.map(({ rating, label, color }) => (
        <button
          key={rating}
          onClick={() => handleRate(rating)}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl font-medium transition-colors ${color}`}
        >
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs opacity-75">{intervals[rating]}</span>
        </button>
      ))}
    </div>
  )
}
