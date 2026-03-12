import './DailyGoal.css'

interface Props {
  reviewed: number
  goal: number
}

export function DailyGoal({ reviewed, goal }: Props) {
  const percent = Math.min(Math.round((reviewed / goal) * 100), 100)
  const done = reviewed >= goal
  const circumference = 2 * Math.PI * 36
  const strokeOffset = circumference - (percent / 100) * circumference

  return (
    <div className={`daily-goal ${done ? 'daily-goal--done' : ''}`}>
      <div className="daily-goal__ring">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke="var(--app-border)"
            strokeWidth="6"
          />
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke={done ? '#22c55e' : 'url(#goal-gradient)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 44 44)"
            className="daily-goal__progress"
          />
          <defs>
            <linearGradient id="goal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#F7931A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="daily-goal__count">
          <span className="daily-goal__current">{reviewed}</span>
          <span className="daily-goal__separator">/</span>
          <span className="daily-goal__target">{goal}</span>
        </div>
      </div>
      <div className="daily-goal__label">
        {done ? 'Goal reached!' : 'Daily goal'}
      </div>
    </div>
  )
}
