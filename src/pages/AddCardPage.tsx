import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
      await supabase.from('cards').insert({
        set_id: setId,
        front: front.trim(),
        back: back.trim(),
        part_of_speech: pos.trim() || null,
      })
      // Update card count
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('set_id', setId)
      await supabase.from('sets').update({ card_count: count || 0 }).eq('id', setId)
      setMainButtonLoading(false)
      navigate(-1)
    }

    return showMainButton('Add Card', handleSave)
  }, [front, back, pos, setId, navigate])

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-tg-text">Add Card</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tg-hint">English word</span>
        <input
          value={front}
          onChange={e => setFront(e.target.value)}
          placeholder="e.g. accomplish"
          className="bg-tg-section-bg rounded-xl px-4 py-3 text-tg-text outline-none placeholder:text-tg-hint/50"
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tg-hint">Russian translation</span>
        <input
          value={back}
          onChange={e => setBack(e.target.value)}
          placeholder="e.g. выполнять, достигать"
          className="bg-tg-section-bg rounded-xl px-4 py-3 text-tg-text outline-none placeholder:text-tg-hint/50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tg-hint">Part of speech (optional)</span>
        <input
          value={pos}
          onChange={e => setPos(e.target.value)}
          placeholder="e.g. verb, noun, adjective"
          className="bg-tg-section-bg rounded-xl px-4 py-3 text-tg-text outline-none placeholder:text-tg-hint/50"
        />
      </label>
    </div>
  )
}
