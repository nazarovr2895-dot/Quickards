export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-tg-text">Settings</h1>

      <div className="bg-tg-section-bg rounded-xl p-4">
        <h3 className="font-semibold text-tg-text">About Quickards</h3>
        <p className="text-sm text-tg-hint mt-1">
          Flashcard app for learning English with spaced repetition (FSRS algorithm).
        </p>
        <p className="text-sm text-tg-hint mt-2">
          The app uses scientifically-proven spaced repetition to schedule reviews at optimal intervals, helping you memorize words permanently.
        </p>
      </div>

      <div className="bg-tg-section-bg rounded-xl p-4">
        <h3 className="font-semibold text-tg-text">How it works</h3>
        <ul className="text-sm text-tg-hint mt-1 flex flex-col gap-1">
          <li>1. Pick a word set to study</li>
          <li>2. See a word, try to recall the translation</li>
          <li>3. Rate how well you remembered</li>
          <li>4. The algorithm schedules optimal review time</li>
          <li>5. Review consistently to never forget!</li>
        </ul>
      </div>

      <div className="bg-tg-section-bg rounded-xl p-4">
        <h3 className="font-semibold text-tg-text">Rating guide</h3>
        <ul className="text-sm text-tg-hint mt-1 flex flex-col gap-1">
          <li><span className="text-red-500 font-medium">Again</span> - Didn't remember at all</li>
          <li><span className="text-orange-500 font-medium">Hard</span> - Remembered with difficulty</li>
          <li><span className="text-green-500 font-medium">Good</span> - Remembered correctly</li>
          <li><span className="text-blue-500 font-medium">Easy</span> - Remembered instantly</li>
        </ul>
      </div>

      <p className="text-xs text-tg-hint text-center">
        v1.0.0 - Powered by FSRS
      </p>
    </div>
  )
}
