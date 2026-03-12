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
      className="w-full rounded-xl p-4 text-left flex items-center gap-3 transition-opacity active:opacity-70"
      style={{
        background: 'var(--app-bg-elevated)',
        border: '1px solid var(--app-border)',
      }}
    >
      {set.cefr_level && (
        <div className={`${cefrColor(set.cefr_level)} text-white text-xs font-bold rounded-lg w-10 h-10 flex items-center justify-center shrink-0`}>
          {set.cefr_level}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate" style={{ color: 'var(--app-text)' }}>{set.name}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
          {pluralCards(set.card_count)}
          {subscribed && <span className="ml-2 font-medium" style={{ color: 'var(--app-accent)' }}>Studying</span>}
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--app-text-secondary)' }} className="shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
