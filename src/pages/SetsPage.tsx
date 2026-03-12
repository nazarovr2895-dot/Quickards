import { SetCard } from '../components/SetCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSystemSets, useUserSets, useSubscribedSets } from '../hooks/useSets'
import { useNavigate } from 'react-router-dom'
import './SetsPage.css'

interface Props {
  userId: number | undefined
}

export function SetsPage({ userId }: Props) {
  const { sets: systemSets, loading: systemLoading } = useSystemSets()
  const { sets: customSets, loading: customLoading } = useUserSets(userId)
  const { isSubscribed } = useSubscribedSets(userId)
  const navigate = useNavigate()

  if (systemLoading || customLoading) return <LoadingSpinner />

  const oxford3000 = systemSets.filter(s => s.source === 'oxford3000')
  const oxford5000 = systemSets.filter(s => s.source === 'oxford5000')

  return (
    <div className="sets-page">
      <div className="sets-page__header">
        <h1 className="sets-page__title">Sets</h1>
        <button
          onClick={() => navigate('/sets/new')}
          className="sets-page__new-btn"
        >
          + New Set
        </button>
      </div>

      {oxford3000.length > 0 && (
        <div className="sets-page__section">
          <h2 className="sets-page__section-title">Oxford 3000</h2>
          {oxford3000.map(set => (
            <SetCard key={set.id} set={set} subscribed={isSubscribed(set.id)} />
          ))}
        </div>
      )}

      {oxford5000.length > 0 && (
        <div className="sets-page__section">
          <h2 className="sets-page__section-title">Oxford 5000</h2>
          {oxford5000.map(set => (
            <SetCard key={set.id} set={set} subscribed={isSubscribed(set.id)} />
          ))}
        </div>
      )}

      {customSets.length > 0 && (
        <div className="sets-page__section">
          <h2 className="sets-page__section-title">My Sets</h2>
          {customSets.map(set => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      )}
    </div>
  )
}
