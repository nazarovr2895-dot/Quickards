import { useNavigate } from 'react-router-dom'
import { StatsBar } from '../components/StatsBar'
import { SetCard } from '../components/SetCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
import { useStats } from '../hooks/useStats'

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
  const subscribedSets = userSets.filter(us => us.sets).map(us => us.sets!)

  return (
    <div className="flex flex-col gap-5 p-4 pb-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>
        {userName ? `Hello, ${userName}` : 'Quickards'}
      </h1>

      <StatsBar stats={stats} />

      <button
        onClick={() => navigate('/study')}
        className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
        style={hasDue ? {
          background: 'var(--app-gradient)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(255,107,53,0.3)',
        } : {
          background: 'transparent',
          color: 'var(--app-accent)',
          border: '2px solid var(--app-accent)',
        }}
      >
        {hasDue && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {hasDue ? `Study Now (${stats.dueToday} due)` : 'Start Learning'}
      </button>

      {subscribedSets.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)', fontFamily: "'Outfit', sans-serif" }}>
            My Sets
          </h2>
          {subscribedSets.map(set => (
            <SetCard key={set.id} set={set} subscribed />
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
