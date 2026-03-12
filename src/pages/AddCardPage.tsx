import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { showBackButton, showMainButton, setMainButtonLoading } from '../lib/telegram'

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

  const inputStyle = {
    background: 'var(--app-bg-elevated)',
    border: '1px solid var(--app-border)',
    color: 'var(--app-text)',
    boxShadow: 'var(--app-shadow)',
  }

  return (
    <div className="flex flex-col gap-5 p-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)', fontFamily: "'Outfit', sans-serif" }}>Add Card</h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>English word</span>
        <input
          value={front}
          onChange={e => setFront(e.target.value)}
          placeholder="e.g. accomplish"
          className="rounded-2xl px-4 py-3.5 outline-none transition-all duration-200 focus:border-[var(--app-accent)]"
          style={inputStyle}
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>Russian translation</span>
        <input
          value={back}
          onChange={e => setBack(e.target.value)}
          placeholder="e.g. выполнять, достигать"
          className="rounded-2xl px-4 py-3.5 outline-none transition-all duration-200 focus:border-[var(--app-accent)]"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>Part of speech (optional)</span>
        <input
          value={pos}
          onChange={e => setPos(e.target.value)}
          placeholder="e.g. verb, noun, adjective"
          className="rounded-2xl px-4 py-3.5 outline-none transition-all duration-200 focus:border-[var(--app-accent)]"
          style={inputStyle}
        />
      </label>
    </div>
  )
}
