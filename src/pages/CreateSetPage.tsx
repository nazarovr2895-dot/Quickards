import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { showBackButton, showMainButton, setMainButtonLoading } from '../lib/telegram'

interface Props {
  userId: number | undefined
}

export function CreateSetPage({ userId }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  useEffect(() => {
    const handleSave = async () => {
      if (!name.trim() || !userId) return
      setMainButtonLoading(true)
      const data = await apiPost<{ id: string }>('/api/sets', {
        name: name.trim(),
        description: description.trim() || null,
      })
      setMainButtonLoading(false)
      if (data?.id) {
        navigate(`/sets/${data.id}`, { replace: true })
      }
    }

    return showMainButton('Save Set', handleSave)
  }, [name, description, userId, navigate])

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>New Set</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: 'var(--app-text-secondary)' }}>Name</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Business English"
          className="rounded-xl px-4 py-3 outline-none transition-shadow"
          style={{
            background: 'var(--app-bg-elevated)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: 'var(--app-text-secondary)' }}>Description (optional)</span>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's this set about?"
          rows={3}
          className="rounded-xl px-4 py-3 outline-none resize-none transition-shadow"
          style={{
            background: 'var(--app-bg-elevated)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
      </label>
    </div>
  )
}
