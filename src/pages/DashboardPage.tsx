import { useNavigate } from 'react-router-dom'
import { StatsBar } from '../components/StatsBar'
import { DailyGoal } from '../components/DailyGoal'
import { ProgressOverview } from '../components/ProgressOverview'
import { StreakCalendar } from '../components/StreakCalendar'
import { SetCard } from '../components/SetCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
import { useStats } from '../hooks/useStats'
import './DashboardPage.css'

interface Props {
  userId: number | undefined
  userName?: string
}

export function DashboardPage({ userId, userName }: Props) {
  const { stats, loading: statsLoading } = useStats(userId)
  const { userSets, loading: setsLoading } = useSubscribedSets(userId)
  const navigate = useNavigate()

  if (statsLoading || setsLoading) return <LoadingSpinner />

  const hasDue = stats.dueToday > 0
  const subscribedWithProgress = userSets.filter(us => us.sets)

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">
        {userName ? `Hello, ${userName}` : 'Quickards'}
      </h1>

      <DailyGoal reviewed={stats.reviewedToday} goal={stats.dailyGoal} />

      <StatsBar stats={stats} />

      <ProgressOverview userId={userId} />

      <StreakCalendar userId={userId} />

      <button
        onClick={() => navigate('/analytics')}
        className="dashboard__analytics-btn"
      >
        View detailed stats
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button
        onClick={() => navigate('/study')}
        className={`dashboard__cta ${hasDue ? 'dashboard__cta--primary' : 'dashboard__cta--secondary'}`}
      >
        {hasDue && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {hasDue ? `Study Now (${stats.dueToday} due)` : 'Start Learning'}
      </button>

      {subscribedWithProgress.length > 0 ? (
        <div className="dashboard__section">
          <h2 className="dashboard__section-title">My Sets</h2>
          {subscribedWithProgress.map(us => (
            <SetCard key={us.sets!.id} set={us.sets!} subscribed learnedCount={us.learned_count} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="&#128218;"
          title="No sets yet"
          description="Go to Sets tab to find Oxford word lists and start learning!"
        />
      )}
    </div>
  )
}
