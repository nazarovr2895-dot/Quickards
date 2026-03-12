import { useTheme } from '../hooks/useTheme'

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>Settings</h1>

      {/* Theme toggle */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{
          background: 'var(--app-bg-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>Dark Mode</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-text-secondary)' }}>
            {theme === 'dark' ? 'Dark theme is on' : 'Light theme is on'}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="relative w-[44px] h-[26px] rounded-full transition-colors"
          style={{
            background: theme === 'dark' ? 'var(--app-accent)' : 'var(--app-border)',
          }}
        >
          <div
            className="absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full transition-transform"
            style={{
              background: theme === 'dark' ? 'var(--app-bg)' : '#ffffff',
              transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--app-bg-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>About Quickards</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-secondary)' }}>
          Flashcard app for learning English with spaced repetition (FSRS algorithm).
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--app-text-secondary)' }}>
          The app uses scientifically-proven spaced repetition to schedule reviews at optimal intervals, helping you memorize words permanently.
        </p>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--app-bg-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>How it works</h3>
        <ul className="text-sm mt-1 flex flex-col gap-1" style={{ color: 'var(--app-text-secondary)' }}>
          <li>1. Pick a word set to study</li>
          <li>2. See a word, try to recall the translation</li>
          <li>3. Rate how well you remembered</li>
          <li>4. The algorithm schedules optimal review time</li>
          <li>5. Review consistently to never forget!</li>
        </ul>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--app-bg-elevated)',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>Rating guide</h3>
        <ul className="text-sm mt-1 flex flex-col gap-1" style={{ color: 'var(--app-text-secondary)' }}>
          <li><span style={{ color: '#ef4444' }} className="font-medium">Again</span> - Didn't remember at all</li>
          <li><span style={{ color: '#f97316' }} className="font-medium">Hard</span> - Remembered with difficulty</li>
          <li><span style={{ color: '#22c55e' }} className="font-medium">Good</span> - Remembered correctly</li>
          <li><span style={{ color: '#3b82f6' }} className="font-medium">Easy</span> - Remembered instantly</li>
        </ul>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--app-text-secondary)' }}>
        v1.0.0 - Powered by FSRS
      </p>
    </div>
  )
}
