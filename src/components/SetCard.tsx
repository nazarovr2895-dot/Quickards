import { useNavigate } from 'react-router-dom'
import { cefrColor, pluralCards } from '../lib/utils'
import type { DBSet } from '../lib/types'

interface Props {
  set: DBSet
  subscribed?: boolean
}

export function SetCard({ set, subscribed }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/sets/${set.id}`)}
      className="w-full bg-tg-section-bg rounded-xl p-4 text-left flex items-center gap-3 active:opacity-80 transition-opacity"
    >
      {set.cefr_level && (
        <div className={`${cefrColor(set.cefr_level)} text-white text-xs font-bold rounded-lg w-10 h-10 flex items-center justify-center shrink-0`}>
          {set.cefr_level}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-tg-text truncate">{set.name}</div>
        <div className="text-xs text-tg-hint mt-0.5">
          {pluralCards(set.card_count)}
          {subscribed && <span className="text-tg-accent ml-2">Studying</span>}
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tg-hint shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
