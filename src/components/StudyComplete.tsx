import { useNavigate } from 'react-router-dom'
import { hapticNotification } from '../lib/telegram'
import { useEffect } from 'react'
import type { SessionAccuracy } from '../hooks/useStudySession'
import './StudyComplete.css'

interface Props {
  reviewed: number
  newLearned: number
  accuracy: SessionAccuracy
}

export function StudyComplete({ reviewed, newLearned, accuracy }: Props) {
  const navigate = useNavigate()
  const total = accuracy.correct + accuracy.incorrect
  const accuracyPercent = total > 0 ? Math.round((accuracy.correct / total) * 100) : 100

  useEffect(() => {
    hapticNotification('success')
  }, [])

  return (
    <div className="study-complete">
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
        <div className="study-complete__stat">
          <span className={`study-complete__stat-value ${accuracyPercent >= 80 ? 'study-complete__stat-value--new' : 'study-complete__stat-value--accuracy'}`}>
            {accuracyPercent}%
          </span>
          <span className="study-complete__stat-label">accuracy</span>
        </div>
      </div>

      {accuracy.hardWords.length > 0 && (
        <div className="study-complete__hard-words" style={{ animation: 'fadeInUp 0.4s ease-out 0.25s both' }}>
          <p className="study-complete__hard-words-title">Words to practice</p>
          <div className="study-complete__hard-words-list">
            {accuracy.hardWords.slice(0, 5).map(word => (
              <span key={word} className="study-complete__hard-word">{word}</span>
            ))}
            {accuracy.hardWords.length > 5 && (
              <span className="study-complete__hard-word study-complete__hard-word--more">
                +{accuracy.hardWords.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

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
