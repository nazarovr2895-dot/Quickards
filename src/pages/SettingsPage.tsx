import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useStats } from '../hooks/useStats'
import { apiPut } from '../lib/api'
import { showToast } from '../components/Toast'
import './SettingsPage.css'

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const LightbulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
)

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const GOAL_OPTIONS = [10, 20, 30, 50]

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)

interface Props {
  userId?: number
}

export function SettingsPage({ userId }: Props) {
  const { theme, toggleTheme } = useTheme()
  const { stats } = useStats(userId)
  const [activeGoal, setActiveGoal] = useState(20)

  useEffect(() => {
    if (stats.dailyGoal) setActiveGoal(stats.dailyGoal)
  }, [stats.dailyGoal])

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>

      {/* Theme toggle */}
      <div className="settings-card">
        <div className="settings-card__header">
          <div className="settings-card__icon-wrap">
            <MoonIcon />
          </div>
          <div className="settings-card__info">
            <h3 className="settings-card__title">Dark Mode</h3>
            <p className="settings-card__subtitle">
              {theme === 'dark' ? 'Dark theme is on' : 'Light theme is on'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`toggle-switch ${theme === 'dark' ? 'toggle-switch--on' : 'toggle-switch--off'}`}
          >
            <div className={`toggle-switch__knob ${theme === 'dark' ? 'toggle-switch__knob--on' : ''}`} />
          </button>
        </div>
      </div>

      {/* Daily goal */}
      <div className="settings-card">
        <div className="settings-card__header settings-card__header--with-body">
          <div className="settings-card__icon-wrap">
            <TargetIcon />
          </div>
          <div className="settings-card__info">
            <h3 className="settings-card__title">Daily Goal</h3>
            <p className="settings-card__subtitle">Cards to review per day</p>
          </div>
        </div>
        <div className="settings-card__goal-options">
          {GOAL_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`settings-card__goal-btn ${activeGoal === opt ? 'settings-card__goal-btn--active' : ''}`}
              onClick={async () => {
                setActiveGoal(opt)
                await apiPut('/api/users/daily-goal', { daily_goal: opt })
                showToast(`Daily goal set to ${opt} cards`)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card__header settings-card__header--with-body">
          <div className="settings-card__icon-wrap">
            <InfoIcon />
          </div>
          <h3 className="settings-card__title">About Quickards</h3>
        </div>
        <div className="settings-card__body">
          <p>Flashcard app for learning English with spaced repetition (FSRS algorithm).</p>
          <p>The app uses scientifically-proven spaced repetition to schedule reviews at optimal intervals, helping you memorize words permanently.</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card__header settings-card__header--with-body">
          <div className="settings-card__icon-wrap">
            <LightbulbIcon />
          </div>
          <h3 className="settings-card__title">How it works</h3>
        </div>
        <ul className="settings-card__list">
          <li>1. Pick a word set to study</li>
          <li>2. See a word, try to recall the translation</li>
          <li>3. Rate how well you remembered</li>
          <li>4. The algorithm schedules optimal review time</li>
          <li>5. Review consistently to never forget!</li>
        </ul>
      </div>

      <div className="settings-card">
        <div className="settings-card__header settings-card__header--with-body">
          <div className="settings-card__icon-wrap">
            <StarIcon />
          </div>
          <h3 className="settings-card__title">Rating guide</h3>
        </div>
        <ul className="settings-card__list">
          <li><span className="settings-card__list-highlight--again">Again</span> - Didn't remember at all</li>
          <li><span className="settings-card__list-highlight--hard">Hard</span> - Remembered with difficulty</li>
          <li><span className="settings-card__list-highlight--good">Good</span> - Remembered correctly</li>
          <li><span className="settings-card__list-highlight--easy">Easy</span> - Remembered instantly</li>
        </ul>
      </div>

      <p className="settings__version">v1.0.0 - Powered by FSRS</p>
    </div>
  )
}
