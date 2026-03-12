import type { StudyStats } from '../lib/types'

interface Props {
  stats: StudyStats
}

export function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatItem value={stats.dueToday} label="Due today" color="#FF6B35" bg="rgba(255,107,53,0.1)" delay={0} />
      <StatItem value={stats.totalReviewed} label="Reviewed" color="#F7931A" bg="rgba(247,147,26,0.1)" delay={0.05} />
      <StatItem value={stats.newAvailable} label="New" color="#22c55e" bg="rgba(34,197,94,0.1)" delay={0.1} />
    </div>
  )
}

function StatItem({ value, label, color, bg, delay }: { value: number; label: string; color: string; bg: string; delay: number }) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: bg,
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      <div className="text-2xl font-bold heading-font" style={{ color, fontFamily: "'Outfit', sans-serif" }}>{value}</div>
      <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--app-text-secondary)' }}>{label}</div>
    </div>
  )
}
