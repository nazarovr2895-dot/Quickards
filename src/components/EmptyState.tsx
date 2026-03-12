interface Props {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>{title}</h3>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-secondary)' }}>{description}</p>
      )}
    </div>
  )
}
