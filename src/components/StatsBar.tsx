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
      <StreakItem value={stats.streak} delay={0.15} />
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

function StreakItem({ value, delay }: { value: number; delay: number }) {
  const isActive = value > 0
  return (
    <div
      className={`stats-bar__item stats-bar__item--streak${isActive ? ' stats-bar__item--streak-active' : ''}`}
      style={{ animation: `fadeInUp 0.4s ease-out ${delay}s both` }}
    >
      <div className="stats-bar__streak-icon">{isActive ? '\uD83D\uDD25' : '\u2744\uFE0F'}</div>
      <div className="stats-bar__value stats-bar__value--streak">{value}</div>
      <div className="stats-bar__label">{value === 1 ? 'day' : 'days'}</div>
    </div>
  )
}
