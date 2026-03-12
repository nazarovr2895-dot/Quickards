import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { showBackButton, showMainButton, setMainButtonLoading } from '../lib/telegram'
import './AddCardPage.css'
import './CreateSetPage.css'

export function AddCardPage() {
  const { setId } = useParams()
  const navigate = useNavigate()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [pos, setPos] = useState('')

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  useEffect(() => {
    const handleSave = async () => {
      if (!front.trim() || !back.trim() || !setId) return
      setMainButtonLoading(true)
      await apiPost('/api/cards', {
        set_id: setId,
        front: front.trim(),
        back: back.trim(),
        part_of_speech: pos.trim() || null,
      })
      setMainButtonLoading(false)
      navigate(-1)
    }

    return showMainButton('Add Card', handleSave)
  }, [front, back, pos, setId, navigate])

  return (
    <div className="add-card">
      <h1 className="add-card__title">Add Card</h1>

      <label className="form-field">
        <span className="form-field__label">English word</span>
        <input
          value={front}
          onChange={e => setFront(e.target.value)}
          placeholder="e.g. accomplish"
          className="form-field__input"
          autoFocus
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Russian translation</span>
        <input
          value={back}
          onChange={e => setBack(e.target.value)}
          placeholder="e.g. выполнять, достигать"
          className="form-field__input"
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Part of speech (optional)</span>
        <input
          value={pos}
          onChange={e => setPos(e.target.value)}
          placeholder="e.g. verb, noun, adjective"
          className="form-field__input"
        />
      </label>
    </div>
  )
}
