import { SetCard } from '../components/SetCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useSystemSets, useUserSets, useSubscribedSets } from '../hooks/useSets'
import { useNavigate } from 'react-router-dom'

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
    <div className="flex flex-col gap-4 p-4 pb-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>Sets</h1>
        <button
          onClick={() => navigate('/sets/new')}
          className="text-sm font-semibold transition-opacity active:opacity-60"
          style={{ color: 'var(--app-accent)' }}
        >
          + New Set
        </button>
      </div>

      {oxford3000.length > 0 && (
        <Section title="Oxford 3000">
          {oxford3000.map(set => (
            <SetCard key={set.id} set={set} subscribed={isSubscribed(set.id)} />
          ))}
        </Section>
      )}

      {oxford5000.length > 0 && (
        <Section title="Oxford 5000">
          {oxford5000.map(set => (
            <SetCard key={set.id} set={set} subscribed={isSubscribed(set.id)} />
          ))}
        </Section>
      )}

      {customSets.length > 0 && (
        <Section title="My Sets">
          {customSets.map(set => (
            <SetCard key={set.id} set={set} />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text-secondary)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
