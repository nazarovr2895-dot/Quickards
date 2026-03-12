import './EmptyState.css'

interface Props {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <span className="empty-state__emoji">{icon}</span>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
    </div>
  )
}
