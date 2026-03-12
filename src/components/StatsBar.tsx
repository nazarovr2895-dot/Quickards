import type { StudyStats } from '../lib/types'
import './StatsBar.css'

interface Props {
  stats: StudyStats
}

export function StatsBar({ stats }: Props) {
  return (
    <div className="stats-bar">
      <StatItem value={stats.dueToday} label="Due today" color="#FF6B35" bg="rgba(255,107,53,0.1)" delay={0} />
      <StatItem value={stats.totalReviewed} label="Reviewed" color="#F7931A" bg="rgba(247,147,26,0.1)" delay={0.05} />
      <StatItem value={stats.newAvailable} label="New" color="#22c55e" bg="rgba(34,197,94,0.1)" delay={0.1} />
    </div>
  )
}

function StatItem({ value, label, color, bg, delay }: { value: number; label: string; color: string; bg: string; delay: number }) {
  return (
    <div
      className="stats-bar__item"
      style={{ background: bg, animation: `fadeInUp 0.4s ease-out ${delay}s both` }}
    >
      <div className="stats-bar__value" style={{ color }}>{value}</div>
      <div className="stats-bar__label">{label}</div>
    </div>
  )
}
