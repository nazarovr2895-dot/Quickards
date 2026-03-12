export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: '3px solid var(--app-border)',
          borderTopColor: 'var(--app-accent)',
        }}
      />
    </div>
  )
}
