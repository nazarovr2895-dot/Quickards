interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-tg-hint mb-1">
        <span>{current} / {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-tg-separator rounded-full overflow-hidden">
        <div
          className="h-full bg-tg-accent rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
