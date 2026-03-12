import type { StudyStats } from '../lib/types'

interface Props {
  stats: StudyStats
}

export function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatItem value={stats.dueToday} label="Due today" color="#f97316" />
      <StatItem value={stats.totalReviewed} label="Reviewed" color="var(--app-accent)" />
      <StatItem value={stats.newAvailable} label="New" color="#22c55e" />
    </div>
  )
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{
        background: 'var(--app-bg-elevated)',
        border: '1px solid var(--app-border)',
      }}
    >
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>{label}</div>
    </div>
  )
}
