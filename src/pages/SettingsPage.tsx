import { useTheme } from '../hooks/useTheme'

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

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  const cardStyle = {
    background: 'var(--app-bg-elevated)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>Settings</h1>

      {/* Theme toggle */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={cardStyle}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--app-accent-muted)', color: 'var(--app-accent)' }}>
          <MoonIcon />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>Dark Mode</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
            {theme === 'dark' ? 'Dark theme is on' : 'Light theme is on'}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="relative w-[48px] h-[28px] rounded-full transition-all duration-300"
          style={{
            background: theme === 'dark' ? 'var(--app-gradient)' : 'var(--app-surface)',
            border: theme === 'dark' ? 'none' : '1px solid var(--app-border)',
          }}
        >
          <div
            className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full transition-transform duration-300"
            style={{
              background: '#ffffff',
              transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          />
        </button>
      </div>

      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--app-accent-muted)', color: 'var(--app-accent)' }}>
            <InfoIcon />
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>About Quickards</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
          Flashcard app for learning English with spaced repetition (FSRS algorithm).
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--app-text-secondary)' }}>
          The app uses scientifically-proven spaced repetition to schedule reviews at optimal intervals, helping you memorize words permanently.
        </p>
      </div>

      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--app-accent-muted)', color: 'var(--app-accent)' }}>
            <LightbulbIcon />
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>How it works</h3>
        </div>
        <ul className="text-sm flex flex-col gap-1.5" style={{ color: 'var(--app-text-secondary)' }}>
          <li>1. Pick a word set to study</li>
          <li>2. See a word, try to recall the translation</li>
          <li>3. Rate how well you remembered</li>
          <li>4. The algorithm schedules optimal review time</li>
          <li>5. Review consistently to never forget!</li>
        </ul>
      </div>

      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--app-accent-muted)', color: 'var(--app-accent)' }}>
            <StarIcon />
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>Rating guide</h3>
        </div>
        <ul className="text-sm flex flex-col gap-1.5" style={{ color: 'var(--app-text-secondary)' }}>
          <li><span style={{ color: '#ef4444' }} className="font-semibold">Again</span> - Didn't remember at all</li>
          <li><span style={{ color: '#f97316' }} className="font-semibold">Hard</span> - Remembered with difficulty</li>
          <li><span style={{ color: '#22c55e' }} className="font-semibold">Good</span> - Remembered correctly</li>
          <li><span style={{ color: '#3b82f6' }} className="font-semibold">Easy</span> - Remembered instantly</li>
        </ul>
      </div>

      <p className="text-xs text-center py-2" style={{ color: 'var(--app-text-secondary)' }}>
        v1.0.0 - Powered by FSRS
      </p>
    </div>
  )
}
