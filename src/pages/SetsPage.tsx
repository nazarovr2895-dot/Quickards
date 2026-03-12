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
    <div className="flex flex-col gap-5 p-4 pb-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>Sets</h1>
        <button
          onClick={() => navigate('/sets/new')}
          className="text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
          style={{
            color: '#ffffff',
            background: 'var(--app-gradient)',
            boxShadow: '0 2px 8px rgba(255,107,53,0.2)',
          }}
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
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)', fontFamily: "'Outfit', sans-serif" }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
