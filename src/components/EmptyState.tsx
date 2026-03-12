interface Props {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full mb-4"
        style={{ background: 'var(--app-accent-muted)' }}
      >
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
      {description && (
        <p className="text-sm mt-1.5 max-w-[260px]" style={{ color: 'var(--app-text-secondary)' }}>{description}</p>
      )}
    </div>
  )
}
