import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet } from '../lib/api'
import { cefrColor, pluralCards } from '../lib/utils'
import { showBackButton } from '../lib/telegram'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSubscribedSets } from '../hooks/useSets'
import { showToast } from '../components/Toast'
import type { DBSet, DBCard } from '../lib/types'
import './SetDetailPage.css'

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
    const [setData, cardsData] = await Promise.all([
      apiGet<DBSet>(`/api/sets/${setId}`),
      apiGet<DBCard[]>(`/api/sets/${setId}/cards`),
    ])
    setSet(setData)
    setCards(cardsData || [])
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
    <div className="set-detail">
      {/* Header */}
      <div className="set-detail__header">
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

      {/* Actions */}
      <div className="set-detail__actions">
        {subscribed ? (
          <>
            <button
              onClick={() => navigate(`/study/${set.id}`)}
              className="set-detail__btn set-detail__btn--primary"
            >
              Study
            </button>
            <button
              onClick={handleUnsubscribe}
              className="set-detail__btn set-detail__btn--danger"
            >
              Remove
            </button>
          </>
        ) : (
          <button
            onClick={handleSubscribe}
            className="set-detail__btn set-detail__btn--primary"
          >
            Start Studying
          </button>
        )}
      </div>

      {isOwner && (
        <button
          onClick={() => navigate(`/sets/${set.id}/add`)}
          className="set-detail__add-link gradient-text"
        >
          + Add Card
        </button>
      )}

      {/* Card list */}
      <div className="set-detail__cards">
        <h2 className="set-detail__cards-title">Cards</h2>
        {cards.map(card => (
          <div key={card.id} className="set-detail__card-item">
            <div>
              <span className="set-detail__card-front">{card.front}</span>
              {card.part_of_speech && (
                <span className="set-detail__card-pos">{card.part_of_speech}</span>
              )}
            </div>
            <span className="set-detail__card-back">{card.back}</span>
          </div>
        ))}
        {cards.length >= 100 && (
          <p className="set-detail__card-limit">Showing first 100 cards</p>
        )}
      </div>
    </div>
  )
}
