import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import { hapticFeedback } from '../lib/telegram'
import './RatingButtons.css'

interface Props {
  intervals: Record<number, string> | null
  onRate: (rating: Grade) => void
  visible: boolean
  maxRating?: Grade
}

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ThinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const buttons: { rating: Grade; label: string; modifier: string; Icon: React.FC }[] = [
  { rating: Rating.Again, label: 'Again', modifier: 'again', Icon: XIcon },
  { rating: Rating.Hard, label: 'Hard', modifier: 'hard', Icon: ThinkIcon },
  { rating: Rating.Good, label: 'Good', modifier: 'good', Icon: CheckIcon },
  { rating: Rating.Easy, label: 'Easy', modifier: 'easy', Icon: StarIcon },
]

export function RatingButtons({ intervals, onRate, visible, maxRating }: Props) {
  if (!visible || !intervals) return null

  const handleRate = (rating: Grade) => {
    hapticFeedback('medium')
    onRate(rating)
  }

  const visibleButtons = maxRating !== undefined
    ? buttons.filter(b => b.rating <= maxRating)
    : buttons

  return (
    <div className="rating-buttons">
      {visibleButtons.map(({ rating, label, modifier, Icon }) => (
        <button
          key={rating}
          onClick={() => handleRate(rating)}
          className={`rating-button rating-button--${modifier}`}
        >
          <Icon />
          <span className="rating-button__label">{label}</span>
          <span className="rating-button__interval">{intervals[rating]}</span>
        </button>
      ))}
    </div>
  )
}
