import { Rating } from '../lib/fsrs'
import type { Grade } from '../lib/fsrs'
import { hapticFeedback } from '../lib/telegram'

interface Props {
  intervals: Record<number, string> | null
  onRate: (rating: Grade) => void
  visible: boolean
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

const buttons: { rating: Grade; label: string; bg: string; text: string; Icon: React.FC }[] = [
  { rating: Rating.Again, label: 'Again', bg: 'rgba(239,68,68,0.12)', text: '#ef4444', Icon: XIcon },
  { rating: Rating.Hard, label: 'Hard', bg: 'rgba(249,115,22,0.12)', text: '#f97316', Icon: ThinkIcon },
  { rating: Rating.Good, label: 'Good', bg: 'rgba(34,197,94,0.12)', text: '#22c55e', Icon: CheckIcon },
  { rating: Rating.Easy, label: 'Easy', bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', Icon: StarIcon },
]

export function RatingButtons({ intervals, onRate, visible }: Props) {
  if (!visible || !intervals) return null

  const handleRate = (rating: Grade) => {
    hapticFeedback('medium')
    onRate(rating)
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 w-full mx-auto" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {buttons.map(({ rating, label, bg, text, Icon }) => (
        <button
          key={rating}
          onClick={() => handleRate(rating)}
          className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl font-medium transition-all duration-200 active:scale-95"
          style={{
            background: bg,
            color: text,
            boxShadow: `0 2px 8px ${bg}`,
          }}
        >
          <Icon />
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-[10px] opacity-70">{intervals[rating]}</span>
        </button>
      ))}
    </div>
  )
}
