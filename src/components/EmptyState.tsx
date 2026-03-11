interface Props {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-lg font-semibold text-tg-text">{title}</h3>
      {description && (
        <p className="text-sm text-tg-hint mt-1">{description}</p>
      )}
    </div>
  )
}
