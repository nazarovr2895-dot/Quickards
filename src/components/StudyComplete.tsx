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
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Decorative glow */}
      <div
        className="relative flex items-center justify-center"
        style={{ animation: 'scaleIn 0.5s ease-out' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="text-6xl relative z-10">&#127881;</div>
      </div>

      <h2
        className="text-2xl font-bold gradient-text"
        style={{ fontFamily: "'Outfit', sans-serif", animation: 'fadeInUp 0.4s ease-out 0.1s both' }}
      >
        Session Complete!
      </h2>

      <div className="flex gap-8" style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold gradient-text" style={{ fontFamily: "'Outfit', sans-serif" }}>{reviewed}</span>
          <span className="text-sm font-medium" style={{ color: 'var(--app-text-secondary)' }}>reviewed</span>
        </div>
        {newLearned > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold" style={{ color: '#22c55e', fontFamily: "'Outfit', sans-serif" }}>{newLearned}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--app-text-secondary)' }}>new learned</span>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-4 px-8 py-3.5 rounded-2xl font-semibold text-base text-white transition-all duration-200 active:scale-95"
        style={{
          background: 'var(--app-gradient)',
          boxShadow: '0 4px 16px rgba(255,107,53,0.25)',
          animation: 'fadeInUp 0.4s ease-out 0.3s both',
        }}
      >
        Back to Home
      </button>
    </div>
  )
}
