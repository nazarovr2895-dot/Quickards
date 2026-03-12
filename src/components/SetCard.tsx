import { useNavigate } from 'react-router-dom'
import { cefrColor, pluralCards } from '../lib/utils'
import type { DBSet } from '../lib/types'
import './SetCard.css'

interface Props {
  set: DBSet
  subscribed?: boolean
  learnedCount?: number
}

export function SetCard({ set, subscribed, learnedCount }: Props) {
  const navigate = useNavigate()
  const showProgress = subscribed && learnedCount !== undefined && set.card_count > 0
  const progressPercent = showProgress ? Math.round((learnedCount / set.card_count) * 100) : 0

  return (
    <button
      onClick={() => navigate(`/sets/${set.id}`)}
      className="set-card"
    >
      {set.cefr_level && (
        <div className="set-card__level" style={cefrColor(set.cefr_level)}>
          {set.cefr_level}
        </div>
      )}
      <div className="set-card__content">
        <div className="set-card__name">{set.name}</div>
        <div className="set-card__meta">
          {showProgress
            ? <>{learnedCount} / {pluralCards(set.card_count)} learned</>
            : pluralCards(set.card_count)
          }
          {subscribed && !showProgress && <span className="set-card__studying">Studying</span>}
        </div>
        {showProgress && (
          <div className="set-card__progress">
            <div className="set-card__progress-track">
              <div
                className="set-card__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <svg className="set-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
