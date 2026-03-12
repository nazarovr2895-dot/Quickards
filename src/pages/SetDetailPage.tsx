import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cefrColor, pluralCards } from '../lib/utils'
import { showBackButton } from '../lib/telegram'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
import { showToast } from '../components/Toast'
import type { DBSet, DBCard } from '../lib/types'

interface Props {
  userId: number | undefined
}

export function SetDetailPage({ userId }: Props) {
  const { setId } = useParams()
  const navigate = useNavigate()
  const [set, setSet] = useState<DBSet | null>(null)
  const [cards, setCards] = useState<DBCard[]>([])
  const [loading, setLoading] = useState(true)
  const { isSubscribed, subscribe, unsubscribe } = useSubscribedSets(userId)

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  const loadSet = useCallback(async () => {
    if (!setId) return
    const [setRes, cardsRes] = await Promise.all([
      supabase.from('sets').select('*').eq('id', setId).single(),
      supabase.from('cards').select('*').eq('set_id', setId).order('front').limit(100),
    ])
    setSet(setRes.data)
    setCards(cardsRes.data || [])
    setLoading(false)
  }, [setId])

  useEffect(() => { loadSet() }, [loadSet])

  if (loading || !set) return <LoadingSpinner />

  const subscribed = isSubscribed(set.id)
  const isOwner = set.owner_id === userId

  const handleSubscribe = async () => {
    await subscribe(set.id)
    showToast('Added to your sets')
  }

  const handleUnsubscribe = async () => {
    await unsubscribe(set.id)
    showToast('Removed from your sets')
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-2">
      {/* Header */}
      <div className="flex items-start gap-3">
        {set.cefr_level && (
          <div className={`${cefrColor(set.cefr_level)} text-white text-sm font-bold rounded-xl w-12 h-12 flex items-center justify-center shrink-0`}>
            {set.cefr_level}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>{set.name}</h1>
          <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{pluralCards(set.card_count)}</p>
          {set.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--app-text-secondary)' }}>{set.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {subscribed ? (
          <>
            <button
              onClick={() => navigate(`/study/${set.id}`)}
              className="flex-1 py-3 rounded-xl font-semibold transition-opacity active:opacity-70"
              style={{ background: 'var(--app-accent)', color: 'var(--app-bg)' }}
            >
              Study
            </button>
            <button
              onClick={handleUnsubscribe}
              className="px-4 py-3 rounded-xl font-semibold transition-opacity active:opacity-70"
              style={{
                background: 'var(--app-error-bg)',
                color: 'var(--app-error)',
              }}
            >
              Remove
            </button>
          </>
        ) : (
          <button
            onClick={handleSubscribe}
            className="flex-1 py-3 rounded-xl font-semibold transition-opacity active:opacity-70"
            style={{ background: 'var(--app-accent)', color: 'var(--app-bg)' }}
          >
            Start Studying
          </button>
        )}
      </div>

      {isOwner && (
        <button
          onClick={() => navigate(`/sets/${set.id}/add`)}
          className="text-sm font-semibold transition-opacity active:opacity-60"
          style={{ color: 'var(--app-accent)' }}
        >
          + Add Card
        </button>
      )}

      {/* Card list */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--app-text-secondary)' }}>
          Cards
        </h2>
        {cards.map(card => (
          <div
            key={card.id}
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: 'var(--app-bg-elevated)',
              border: '1px solid var(--app-border)',
            }}
          >
            <div>
              <span className="font-medium" style={{ color: 'var(--app-text)' }}>{card.front}</span>
              {card.part_of_speech && (
                <span className="text-xs ml-1 italic" style={{ color: 'var(--app-text-secondary)' }}>{card.part_of_speech}</span>
              )}
            </div>
            <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{card.back}</span>
          </div>
        ))}
        {cards.length >= 100 && (
          <p className="text-center text-xs py-2" style={{ color: 'var(--app-text-secondary)' }}>
            Showing first 100 cards
          </p>
        )}
      </div>
    </div>
  )
}
