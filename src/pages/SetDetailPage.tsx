import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cefrColor, pluralCards } from '../lib/utils'
import { showBackButton, showConfirm } from '../lib/telegram'
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

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

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
    showConfirm('Remove this set from your library?', async (ok) => {
      if (!ok) return
      await unsubscribe(set.id)
      showToast('Removed from your sets')
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

      {/* Footer */}
      <div className="set-detail__footer">
        {isOwner && (
          <button
            onClick={() => navigate(`/sets/${set.id}/add`)}
            className="set-detail__footer-link gradient-text"
          >
            + Add Card
          </button>
        )}
        {subscribed && (
          <button
            onClick={handleRemove}
            className="set-detail__footer-link set-detail__footer-link--danger"
          >
            Remove from my sets
          </button>
        )}
      </div>
    </div>
  )
}
