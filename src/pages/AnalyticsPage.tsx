import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart } from '../components/BarChart'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAnalytics, type AnalyticsPeriod } from '../hooks/useAnalytics'
import { showBackButton } from '../lib/telegram'
import './AnalyticsPage.css'

interface Props {
  userId: number | undefined
}

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

function periodTitle(period: AnalyticsPeriod): string {
  const now = new Date()
  if (period === 'day') {
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }
  if (period === 'week') return 'This Week'
  return 'This Month'
}

export function AnalyticsPage({ userId }: Props) {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const { data, loading } = useAnalytics(userId, period)

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  if (loading) return <LoadingSpinner />

  const summary = data?.summary
  const buckets = data?.buckets || []

  return (
    <div className="analytics-page">
      {/* Period selector */}
      <div className="analytics-page__selector">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`analytics-page__selector-btn ${period === p.key ? 'analytics-page__selector-btn--active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Header card */}
      <div className="analytics-page__card">
        <p className="analytics-page__period-label">{periodTitle(period)}</p>
        <p className="analytics-page__total">
          <span className="analytics-page__total-number gradient-text">
            {summary?.totalReviews ?? 0}
          </span>
          <span className="analytics-page__total-label"> cards</span>
        </p>

        <BarChart buckets={buckets} height={180} />

        <div className="analytics-page__legend">
          <span className="analytics-page__legend-item">
            <span className="analytics-page__legend-dot" style={{ backgroundColor: 'var(--app-accent)' }} />
            Reviewed
          </span>
          <span className="analytics-page__legend-item">
            <span className="analytics-page__legend-dot" style={{ backgroundColor: '#06b6d4' }} />
            New Learned
          </span>
        </div>
      </div>

      {/* Summary grid */}
      {summary && (
        <div className="analytics-page__summary">
          <div className="analytics-page__stat">
            <span className="analytics-page__stat-value">{summary.wordsLearned}</span>
            <span className="analytics-page__stat-label">Words Learned</span>
          </div>
          <div className="analytics-page__stat">
            <span className="analytics-page__stat-value">{Math.round(summary.accuracy * 100)}%</span>
            <span className="analytics-page__stat-label">Accuracy</span>
          </div>
          <div className="analytics-page__stat">
            <span className="analytics-page__stat-value">{summary.avgPerDay}</span>
            <span className="analytics-page__stat-label">Avg / Day</span>
          </div>
        </div>
      )}
    </div>
  )
}
