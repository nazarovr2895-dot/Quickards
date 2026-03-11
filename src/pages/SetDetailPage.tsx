import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cefrColor, pluralCards } from '../lib/utils'
import { showBackButton } from '../lib/telegram'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
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
          <h1 className="text-xl font-bold text-tg-text">{set.name}</h1>
          <p className="text-sm text-tg-hint">{pluralCards(set.card_count)}</p>
          {set.description && (
            <p className="text-sm text-tg-subtitle mt-1">{set.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {subscribed ? (
          <>
            <button
              onClick={() => navigate(`/study/${set.id}`)}
              className="flex-1 py-3 bg-tg-button text-tg-button-text rounded-xl font-semibold active:opacity-80"
            >
              Study
            </button>
            <button
              onClick={() => unsubscribe(set.id)}
              className="px-4 py-3 bg-tg-section-bg text-tg-destructive rounded-xl font-semibold active:opacity-80"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            onClick={() => subscribe(set.id)}
            className="flex-1 py-3 bg-tg-button text-tg-button-text rounded-xl font-semibold active:opacity-80"
          >
            Start Studying
          </button>
        )}
      </div>

      {isOwner && (
        <button
          onClick={() => navigate(`/sets/${set.id}/add`)}
          className="text-sm font-semibold text-tg-accent active:opacity-60"
        >
          + Add Card
        </button>
      )}

      {/* Card list */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-tg-hint uppercase tracking-wide mb-1">
          Cards
        </h2>
        {cards.map(card => (
          <div
            key={card.id}
            className="bg-tg-section-bg rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <span className="font-medium text-tg-text">{card.front}</span>
              {card.part_of_speech && (
                <span className="text-xs text-tg-hint ml-1 italic">{card.part_of_speech}</span>
              )}
            </div>
            <span className="text-sm text-tg-subtitle">{card.back}</span>
          </div>
        ))}
        {cards.length >= 100 && (
          <p className="text-center text-xs text-tg-hint py-2">
            Showing first 100 cards
          </p>
        )}
      </div>
    </div>
  )
}
