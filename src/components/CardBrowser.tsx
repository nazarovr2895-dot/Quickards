import { useState } from 'react'
import type { CardWithProgress, CardStatusFilter } from '../lib/types'
import './CardBrowser.css'

interface Props {
  cards: CardWithProgress[]
  total: number
  search: string
  onSearchChange: (s: string) => void
  statusFilter: CardStatusFilter
  onStatusFilterChange: (f: CardStatusFilter) => void
  breakdown: { new: number; learning: number; review: number; mastered: number }
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  subscribed: boolean
}

const STATUS_COLORS: Record<string, string> = {
  new: '#22c55e',
  learning: '#eab308',
  review: '#FF6B35',
  mastered: '#06b6d4',
}

function getCardStatus(card: CardWithProgress): string {
  if (card.user_state === null || card.user_state === undefined) return 'new'
  if (card.user_state === 2 && (card.stability ?? 0) >= 21) return 'mastered'
  if (card.user_state === 2) return 'review'
  return 'learning'
}

function formatDue(due: string | null, userState: number | null): string {
  if (userState === null || userState === undefined) return 'New'
  if (userState === 2 && !due) return 'Review'
  if (!due) return 'Learning'
  const d = new Date(due)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Due now'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 30) return `Due in ${diffDays}d`
  const months = Math.round(diffDays / 30)
  return `Due in ${months}mo`
}

const FILTERS: { key: CardStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'learning', label: 'Learning' },
  { key: 'review', label: 'Review' },
  { key: 'mastered', label: 'Mastered' },
]

export function CardBrowser({
  cards,
  total,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  breakdown,
  hasMore,
  loadingMore,
  onLoadMore,
  subscribed,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getFilterCount = (key: CardStatusFilter): number | null => {
    if (!subscribed) return null
    if (key === 'all') return null
    return breakdown[key]
  }

  return (
    <div className="card-browser">
      {/* Search */}
      <div className="card-browser__search-wrap">
        <div className="card-browser__search">
          <svg className="card-browser__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="card-browser__search-input"
            placeholder="Search cards..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          {search && (
            <button className="card-browser__search-clear" onClick={() => onSearchChange('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {subscribed && (
        <div className="card-browser__filters">
          {FILTERS.map(f => {
            const count = getFilterCount(f.key)
            const active = statusFilter === f.key
            return (
              <button
                key={f.key}
                className={`card-browser__chip ${active ? 'card-browser__chip--active' : ''}`}
                onClick={() => onStatusFilterChange(f.key)}
              >
                {f.label}{count !== null ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* Card list */}
      <div className="card-browser__list">
        {cards.map(card => {
          const expanded = expandedId === card.id
          const status = getCardStatus(card)
          return (
            <button
              key={card.id}
              className={`card-browser__item ${expanded ? 'card-browser__item--expanded' : ''}`}
              onClick={() => setExpandedId(expanded ? null : card.id)}
            >
              <div className="card-browser__item-row">
                {subscribed && (
                  <span
                    className="card-browser__status-dot"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                )}
                <div className="card-browser__item-front">
                  <span className="card-browser__word">{card.front}</span>
                  {card.part_of_speech && (
                    <span className="card-browser__pos">{card.part_of_speech}</span>
                  )}
                </div>
                <span className="card-browser__item-back">{card.back}</span>
              </div>
              {expanded && (
                <div className="card-browser__item-detail">
                  {card.phonetics && (
                    <div className="card-browser__phonetics">{card.phonetics}</div>
                  )}
                  {card.example && (
                    <div className="card-browser__example">"{card.example}"</div>
                  )}
                  {subscribed && (
                    <div
                      className="card-browser__due"
                      style={{ color: STATUS_COLORS[status] }}
                    >
                      {formatDue(card.due, card.user_state)}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {cards.length > 0 && (
        <div className="card-browser__footer">
          <span className="card-browser__count">
            Showing {cards.length} of {total}
          </span>
          {hasMore && (
            <button
              className="card-browser__load-more"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}

      {cards.length === 0 && !loadingMore && (
        <div className="card-browser__empty">No cards found</div>
      )}
    </div>
  )
}
