import { useNavigate } from 'react-router-dom'
import { hapticNotification } from '../lib/telegram'
import { useEffect } from 'react'

interface Props {
  reviewed: number
  newLearned: number
}

export function StudyComplete({ reviewed, newLearned }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    hapticNotification('success')
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <div className="text-6xl">&#127881;</div>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>Session Complete!</h2>
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color: 'var(--app-accent)' }}>{reviewed}</span>
          <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>reviewed</span>
        </div>
        {newLearned > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold" style={{ color: '#22c55e' }}>{newLearned}</span>
            <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>new learned</span>
          </div>
        )}
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-6 py-3 rounded-xl font-semibold text-base transition-opacity active:opacity-70"
        style={{
          background: 'var(--app-accent)',
          color: 'var(--app-bg)',
        }}
      >
        Back to Home
      </button>
    </div>
  )
}
