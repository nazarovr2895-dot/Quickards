interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--app-text-secondary)' }}>
        <span className="font-medium">{current} / {total}</span>
        <span className="font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: 'var(--app-accent)' }}>{Math.round(pct)}%</span>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ background: 'var(--app-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'var(--app-gradient)',
            boxShadow: pct > 0 ? '0 0 12px rgba(255,107,53,0.35)' : 'none',
          }}
        />
      </div>
    </div>
  )
}
