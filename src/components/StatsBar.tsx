import type { StudyStats } from '../lib/types'

interface Props {
  stats: StudyStats
}

export function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatItem value={stats.dueToday} label="Due today" color="text-orange-500" />
      <StatItem value={stats.totalReviewed} label="Reviewed" color="text-tg-accent" />
      <StatItem value={stats.newAvailable} label="New" color="text-green-500" />
    </div>
  )
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-tg-section-bg rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-tg-hint mt-0.5">{label}</div>
    </div>
  )
}
