import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { showBackButton, showMainButton, setMainButtonLoading } from '../lib/telegram'
import './CreateSetPage.css'

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
        navigate(`/sets/${data.id}/manage`, { replace: true })
      }
    }

    return showMainButton('Save Set', handleSave)
  }, [name, description, userId, navigate])

  return (
    <div className="create-set">
      <h1 className="create-set__title">New Set</h1>

      <label className="form-field">
        <span className="form-field__label">Name</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Business English"
          className="form-field__input"
          autoFocus
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Description (optional)</span>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's this set about?"
          rows={3}
          className="form-field__input form-field__input--textarea"
        />
      </label>
    </div>
  )
}
