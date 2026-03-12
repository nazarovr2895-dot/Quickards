import { useNavigate } from 'react-router-dom'
import { hapticNotification } from '../lib/telegram'
import { useEffect } from 'react'
import './StudyComplete.css'

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
    <div className="study-complete">
      {/* Decorative glow */}
      <div className="study-complete__glow">
        <div className="study-complete__glow-circle" />
        <div className="study-complete__emoji">&#127881;</div>
      </div>

      <h2 className="study-complete__title gradient-text" style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}>
        Session Complete!
      </h2>

      <div className="study-complete__stats" style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
        <div className="study-complete__stat">
          <span className="study-complete__stat-value gradient-text">{reviewed}</span>
          <span className="study-complete__stat-label">reviewed</span>
        </div>
        {newLearned > 0 && (
          <div className="study-complete__stat">
            <span className="study-complete__stat-value study-complete__stat-value--new">{newLearned}</span>
            <span className="study-complete__stat-label">new learned</span>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        className="study-complete__button"
        style={{ animation: 'fadeInUp 0.4s ease-out 0.3s both' }}
      >
        Back to Home
      </button>
    </div>
  )
}
