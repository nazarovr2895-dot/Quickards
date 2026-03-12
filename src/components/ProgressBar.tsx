import './ProgressBar.css'

interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__count">{current} / {total}</span>
        <span className="progress-bar__percent">{Math.round(pct)}%</span>
      </div>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${pct > 0 ? 'progress-bar__fill--active' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
