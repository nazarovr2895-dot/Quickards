import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import './ProgressOverview.css'

interface ProgressData {
  new: number
  learning: number
  review: number
  mastered: number
}

const SEGMENTS = [
  { key: 'new' as const, label: 'New', color: '#22c55e' },
  { key: 'learning' as const, label: 'Learning', color: '#eab308' },
  { key: 'review' as const, label: 'Review', color: '#FF6B35' },
  { key: 'mastered' as const, label: 'Mastered', color: '#06b6d4' },
]

export function ProgressOverview({ userId }: { userId: number | undefined }) {
  const { data } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => apiGet<ProgressData>('/api/study/progress'),
    enabled: !!userId,
  })

  if (!data) return null

  const total = data.new + data.learning + data.review + data.mastered
  if (total === 0) return null

  return (
    <div className="progress-overview">
      <h3 className="progress-overview__title">Card Progress</h3>
      <div className="progress-overview__bar">
        {SEGMENTS.map(seg => {
          const count = data[seg.key]
          if (count === 0) return null
          const pct = (count / total) * 100
          return (
            <div
              key={seg.key}
              className="progress-overview__segment"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${count}`}
            />
          )
        })}
      </div>
      <div className="progress-overview__legend">
        {SEGMENTS.map(seg => {
          const count = data[seg.key]
          if (count === 0) return null
          return (
            <div key={seg.key} className="progress-overview__legend-item">
              <span className="progress-overview__legend-dot" style={{ backgroundColor: seg.color }} />
              <span className="progress-overview__legend-label">{seg.label}</span>
              <span className="progress-overview__legend-count">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
