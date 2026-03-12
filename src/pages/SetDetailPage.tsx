import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cefrColor, pluralCards } from '../lib/utils'
import { showBackButton, showConfirm } from '../lib/telegram'
import { apiDelete } from '../lib/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { CardBrowser } from '../components/CardBrowser'
import { useSubscribedSets } from '../hooks/useSets'
import { useSetDetail } from '../hooks/useSetDetail'
import { showToast } from '../components/Toast'
import './SetDetailPage.css'

interface Props {
  userId: number | undefined
}

export function SetDetailPage({ userId }: Props) {
  const { setId } = useParams()
  const navigate = useNavigate()
  const { isSubscribed, subscribe, unsubscribe, userSets } = useSubscribedSets(userId)
  const {
    set, cards, total, breakdown, dueCount, loading,
    loadingMore, search, setSearch, statusFilter,
    setStatusFilter, loadMore, hasMore, reload,
  } = useSetDetail(userId, setId)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (loading || !set) return <LoadingSpinner />

  const subscribed = isSubscribed(set.id)
  const isOwner = set.owner_id === userId

  // Get learned count from subscribed sets
  const userSet = userSets.find(us => us.set_id === set.id)
  const learnedCount = userSet?.learned_count ?? 0
  const progressPercent = set.card_count > 0 ? Math.round((learnedCount / set.card_count) * 100) : 0

  // Progress ring constants
  const ringR = 28
  const ringCirc = 2 * Math.PI * ringR
  const ringOffset = ringCirc - (progressPercent / 100) * ringCirc

  const handleSubscribe = async () => {
    await subscribe(set.id)
    showToast('Added to your sets')
    reload()
  }

  const handleRemove = () => {
    setMenuOpen(false)
    showConfirm('Remove this set from your library?', async (ok) => {
      if (!ok) return
      await unsubscribe(set.id)
      showToast('Removed from your sets')
      navigate(-1)
    })
  }

  const handleDeleteSet = () => {
    setMenuOpen(false)
    showConfirm('Delete this set and all its cards? This cannot be undone.', async (ok) => {
      if (!ok) return
      await apiDelete(`/api/sets/${set.id}`)
      showToast('Set deleted')
      navigate(-1)
    })
  }

  // Study button text
  const studyText = dueCount > 0
    ? `Study Now (${dueCount} due)`
    : breakdown.new > 0
    ? 'Learn New Cards'
    : 'All Caught Up!'

  const studyDisabled = dueCount === 0 && breakdown.new === 0
  const showMenu = isOwner || subscribed

  return (
    <div className="set-detail">
      {/* Hero */}
      <div className="set-detail__hero">
        <div className="set-detail__hero-info">
          {set.cefr_level && (
            <div className="set-detail__level" style={cefrColor(set.cefr_level)}>
              {set.cefr_level}
            </div>
          )}
          <div>
            <h1 className="set-detail__name">{set.name}</h1>
            <p className="set-detail__meta">{pluralCards(set.card_count)}</p>
            {set.description && (
              <p className="set-detail__description">{set.description}</p>
            )}
          </div>
        </div>
        <div className="set-detail__hero-right">
          {subscribed && set.card_count > 0 && (
            <div className="set-detail__ring">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r={ringR}
                  fill="none"
                  stroke="var(--app-border)"
                  strokeWidth="5"
                />
                <circle
                  cx="32" cy="32" r={ringR}
                  fill="none"
                  stroke={progressPercent >= 100 ? '#22c55e' : 'url(#set-ring-gradient)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 32 32)"
                  className="set-detail__ring-progress"
                />
                <defs>
                  <linearGradient id="set-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#F7931A" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="set-detail__ring-text">{progressPercent}%</div>
            </div>
          )}
          {showMenu && (
            <div className="set-detail__menu" ref={menuRef}>
              <button
                className="set-detail__menu-btn"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="More options"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <div className="set-detail__dropdown">
                  {isOwner && (
                    <button className="set-detail__dropdown-item set-detail__dropdown-item--danger" onClick={handleDeleteSet}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                      Delete Set
                    </button>
                  )}
                  {subscribed && !isOwner && (
                    <button className="set-detail__dropdown-item set-detail__dropdown-item--danger" onClick={handleRemove}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                      Remove from my sets
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats pills */}
      {subscribed && (
        <div className="set-detail__stats">
          <div className="set-detail__stat" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <span className="set-detail__stat-value" style={{ color: '#22c55e' }}>{breakdown.new}</span>
            <span className="set-detail__stat-label">New</span>
          </div>
          <div className="set-detail__stat" style={{ background: 'rgba(234,179,8,0.1)' }}>
            <span className="set-detail__stat-value" style={{ color: '#eab308' }}>{breakdown.learning}</span>
            <span className="set-detail__stat-label">Learning</span>
          </div>
          <div className="set-detail__stat" style={{ background: 'rgba(255,107,53,0.1)' }}>
            <span className="set-detail__stat-value" style={{ color: '#FF6B35' }}>{breakdown.review}</span>
            <span className="set-detail__stat-label">Review</span>
          </div>
          <div className="set-detail__stat" style={{ background: 'rgba(6,182,212,0.1)' }}>
            <span className="set-detail__stat-value" style={{ color: '#06b6d4' }}>{breakdown.mastered}</span>
            <span className="set-detail__stat-label">Mastered</span>
          </div>
        </div>
      )}

      {/* CTA */}
      {subscribed ? (
        isOwner ? (
          <div className="set-detail__cta-row">
            <button
              onClick={() => navigate(`/sets/${set.id}/manage`)}
              className="set-detail__cta"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Manage Cards
            </button>
            <button
              onClick={() => !studyDisabled && navigate(`/study/${set.id}`)}
              className={`set-detail__cta set-detail__cta--secondary ${studyDisabled ? 'set-detail__cta--muted' : ''}`}
              disabled={studyDisabled}
            >
              {!studyDisabled && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {studyText}
            </button>
          </div>
        ) : (
          <button
            onClick={() => !studyDisabled && navigate(`/study/${set.id}`)}
            className={`set-detail__cta ${studyDisabled ? 'set-detail__cta--muted' : ''}`}
            disabled={studyDisabled}
          >
            {!studyDisabled && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {studyText}
          </button>
        )
      ) : (
        <button onClick={handleSubscribe} className="set-detail__cta">
          Start Studying
        </button>
      )}

      {/* Card Browser */}
      <CardBrowser
        cards={cards}
        total={total}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        breakdown={breakdown}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        subscribed={subscribed}
      />
    </div>
  )
}
