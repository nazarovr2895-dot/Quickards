import { useNavigate } from 'react-router-dom'
import { StatsBar } from '../components/StatsBar'
import { SetCard } from '../components/SetCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
import { useStats } from '../hooks/useStats'

interface Props {
  userId: number | undefined
}

export function DashboardPage({ userId }: Props) {
  const { stats, loading: statsLoading } = useStats(userId)
  const { userSets, loading: setsLoading } = useSubscribedSets(userId)
  const navigate = useNavigate()

  if (statsLoading || setsLoading) return <LoadingSpinner />

  const hasDue = stats.dueToday > 0
  const subscribedSets = userSets.filter(us => us.sets).map(us => us.sets!)

  return (
    <div className="flex flex-col gap-4 p-4 pb-2">
      <h1 className="text-xl font-bold text-tg-text">Quickards</h1>

      <StatsBar stats={stats} />

      <button
        onClick={() => navigate('/study')}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
          hasDue
            ? 'bg-tg-button text-tg-button-text active:opacity-80'
            : 'bg-tg-section-bg text-tg-text active:opacity-80'
        }`}
      >
        {hasDue ? `Study Now (${stats.dueToday} due)` : 'Start Learning'}
      </button>

      {subscribedSets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-tg-hint uppercase tracking-wide">
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
