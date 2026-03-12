export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{
          border: '3px solid var(--app-surface)',
          borderTopColor: '#FF6B35',
          filter: 'drop-shadow(0 0 4px rgba(255,107,53,0.3))',
        }}
      />
    </div>
  )
}
