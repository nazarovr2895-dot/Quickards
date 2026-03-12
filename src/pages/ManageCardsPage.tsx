import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import { showBackButton } from '../lib/telegram'
import { hapticFeedback, hapticNotification, showConfirm } from '../lib/telegram'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { showToast } from '../components/Toast'
import type { DBSet, DBCard } from '../lib/types'
import './ManageCardsPage.css'
import './CreateSetPage.css'

interface Props {
  userId: number | undefined
}

function parseBulkText(text: string, separator: string): { front: string; back: string }[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const idx = line.indexOf(separator)
      if (idx < 0) return null
      const front = line.slice(0, idx).trim()
      const back = line.slice(idx + separator.length).trim()
      if (!front || !back) return null
      return { front, back }
    })
    .filter(Boolean) as { front: string; back: string }[]
}

export function ManageCardsPage({ userId: _userId }: Props) {
  const { setId } = useParams()
  const navigate = useNavigate()
  const frontRef = useRef<HTMLInputElement>(null)

  const [set, setSet] = useState<DBSet | null>(null)
  const [cards, setCards] = useState<DBCard[]>([])
  const [loading, setLoading] = useState(true)

  // Single add form
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [pos, setPos] = useState('')
  const [phonetics, setPhonetics] = useState('')
  const [saving, setSaving] = useState(false)

  // Dictionary lookup
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const lookupAbort = useRef<AbortController | null>(null)
  const backTouched = useRef(false)
  const posTouched = useRef(false)

  // Mode
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // Bulk import
  const [bulkText, setBulkText] = useState('')
  const [separator, setSeparator] = useState(' - ')

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [editPos, setEditPos] = useState('')

  useEffect(() => {
    return showBackButton(() => navigate(-1))
  }, [navigate])

  const loadData = useCallback(async () => {
    if (!setId) return
    try {
      const [setData, cardsData] = await Promise.all([
        apiGet<DBSet>(`/api/sets/${setId}`),
        apiGet<DBCard[]>(`/api/sets/${setId}/cards`),
      ])
      setSet(setData)
      setCards(cardsData || [])
    } finally {
      setLoading(false)
    }
  }, [setId])

  useEffect(() => { loadData() }, [loadData])

  // Debounced dictionary lookup
  useEffect(() => {
    const word = front.trim()
    if (!word || word.length < 2) {
      setLookupState('idle')
      return
    }

    setLookupState('loading')
    const timer = setTimeout(async () => {
      lookupAbort.current?.abort()
      const controller = new AbortController()
      lookupAbort.current = controller

      try {
        const data = await apiGet<{
          valid: boolean
          phonetics?: string
          part_of_speech?: string
          example?: string
          translation?: string
        }>(`/api/dictionary/lookup?word=${encodeURIComponent(word)}`)

        if (controller.signal.aborted) return

        if (data?.valid) {
          setLookupState('valid')
          if (data.phonetics) setPhonetics(data.phonetics)
          if (data.translation && !backTouched.current) setBack(data.translation)
          if (data.part_of_speech && !posTouched.current) setPos(data.part_of_speech)
          hapticFeedback('light')
        } else {
          setLookupState('invalid')
          setPhonetics('')
        }
      } catch {
        if (!controller.signal.aborted) setLookupState('idle')
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      lookupAbort.current?.abort()
    }
  }, [front])

  // Single add
  const handleAdd = async () => {
    if (!front.trim() || !back.trim() || !setId || saving) return
    setSaving(true)
    try {
      const card = await apiPost<DBCard>('/api/cards', {
        set_id: setId,
        front: front.trim(),
        back: back.trim(),
        part_of_speech: pos.trim() || null,
        phonetics: phonetics.trim() || null,
      })
      setCards(prev => [card, ...prev])
      setFront('')
      setBack('')
      setPos('')
      setPhonetics('')
      setLookupState('idle')
      backTouched.current = false
      posTouched.current = false
      hapticNotification('success')
      showToast('Card added')
      frontRef.current?.focus()
    } catch {
      hapticNotification('error')
      showToast('Failed to add card')
    } finally {
      setSaving(false)
    }
  }

  // Bulk import
  const parsed = mode === 'bulk' ? parseBulkText(bulkText, separator) : []

  const handleBulkImport = async () => {
    if (!parsed.length || !setId || saving) return
    setSaving(true)
    try {
      await apiPost('/api/cards/batch', { set_id: setId, cards: parsed })
      hapticNotification('success')
      showToast(`${parsed.length} cards added`)
      setBulkText('')
      // Refetch to get all cards with IDs
      const cardsData = await apiGet<DBCard[]>(`/api/sets/${setId}/cards`)
      setCards(cardsData || [])
    } catch {
      hapticNotification('error')
      showToast('Failed to import cards')
    } finally {
      setSaving(false)
    }
  }

  // Edit
  const startEdit = (card: DBCard) => {
    setEditingId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
    setEditPos(card.part_of_speech || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editFront.trim() || !editBack.trim() || saving) return
    setSaving(true)
    try {
      await apiPut(`/api/cards/${editingId}`, {
        front: editFront.trim(),
        back: editBack.trim(),
        part_of_speech: editPos.trim() || null,
      })
      setCards(prev =>
        prev.map(c =>
          c.id === editingId
            ? { ...c, front: editFront.trim(), back: editBack.trim(), part_of_speech: editPos.trim() || null }
            : c,
        ),
      )
      setEditingId(null)
      hapticNotification('success')
      showToast('Card updated')
    } catch {
      hapticNotification('error')
      showToast('Failed to update card')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDelete = (card: DBCard) => {
    showConfirm(`Delete "${card.front}"?`, async (ok) => {
      if (!ok) return
      try {
        await apiDelete(`/api/cards/${card.id}`)
        setCards(prev => prev.filter(c => c.id !== card.id))
        hapticNotification('warning')
        showToast('Card deleted')
      } catch {
        hapticNotification('error')
        showToast('Failed to delete card')
      }
    })
  }

  const handleModeSwitch = (newMode: 'single' | 'bulk') => {
    setMode(newMode)
    hapticFeedback('light')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="manage-cards">
      {/* Header */}
      <div className="manage-cards__header">
        <h1 className="manage-cards__title">{set?.name || 'Cards'}</h1>
        <span className="manage-cards__count">{cards.length} cards</span>
      </div>

      {/* Mode tabs */}
      <div className="manage-cards__tabs">
        <button
          className={`manage-cards__tab ${mode === 'single' ? 'manage-cards__tab--active' : ''}`}
          onClick={() => handleModeSwitch('single')}
        >
          Add One
        </button>
        <button
          className={`manage-cards__tab ${mode === 'bulk' ? 'manage-cards__tab--active' : ''}`}
          onClick={() => handleModeSwitch('bulk')}
        >
          Bulk Import
        </button>
      </div>

      {/* Single add form */}
      {mode === 'single' && (
        <div className="manage-cards__form">
          <label className="form-field">
            <span className="form-field__label">English word</span>
            <div className="form-field__input-wrap">
              <input
                ref={frontRef}
                value={front}
                onChange={e => {
                  setFront(e.target.value)
                  backTouched.current = false
                  posTouched.current = false
                }}
                placeholder="e.g. accomplish"
                className="form-field__input form-field__input--with-icon"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              {lookupState === 'loading' && (
                <span className="form-field__lookup form-field__lookup--loading" />
              )}
              {lookupState === 'valid' && (
                <svg className="form-field__lookup form-field__lookup--valid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {lookupState === 'invalid' && (
                <svg className="form-field__lookup form-field__lookup--invalid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            {lookupState === 'invalid' && (
              <span className="form-field__hint form-field__hint--warning">Word not found in dictionary</span>
            )}
            {lookupState === 'valid' && phonetics && (
              <span className="form-field__hint form-field__hint--info">{phonetics}</span>
            )}
          </label>

          <label className="form-field">
            <span className="form-field__label">Russian translation</span>
            <input
              value={back}
              onChange={e => { setBack(e.target.value); backTouched.current = true }}
              placeholder="e.g. выполнять, достигать"
              className="form-field__input"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Part of speech (optional)</span>
            <input
              value={pos}
              onChange={e => { setPos(e.target.value); posTouched.current = true }}
              placeholder="e.g. verb, noun, adjective"
              className="form-field__input"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </label>

          <button
            className="manage-cards__add-btn"
            onClick={handleAdd}
            disabled={!front.trim() || !back.trim() || saving}
          >
            {saving ? 'Adding...' : 'Add Card'}
          </button>
        </div>
      )}

      {/* Bulk import form */}
      {mode === 'bulk' && (
        <div className="manage-cards__form">
          <div className="manage-cards__separator-row">
            <span className="form-field__label">Separator</span>
            <div className="manage-cards__separator-options">
              {[
                { value: ' - ', label: 'Dash (-)' },
                { value: '\t', label: 'Tab' },
                { value: ';', label: 'Semicolon (;)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`manage-cards__sep-btn ${separator === opt.value ? 'manage-cards__sep-btn--active' : ''}`}
                  onClick={() => setSeparator(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="form-field">
            <span className="form-field__label">Paste your word list</span>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={`word1${separator}translation1\nword2${separator}translation2\nword3${separator}translation3`}
              rows={8}
              className="form-field__input form-field__input--textarea manage-cards__bulk-textarea"
            />
          </label>

          {bulkText.trim() && (
            <p className={`manage-cards__bulk-info ${parsed.length > 0 ? '' : 'manage-cards__bulk-info--empty'}`}>
              {parsed.length > 0
                ? `${parsed.length} card${parsed.length === 1 ? '' : 's'} detected`
                : 'No valid cards detected. Use the format: word' + separator + 'translation'}
            </p>
          )}

          <button
            className="manage-cards__add-btn"
            onClick={handleBulkImport}
            disabled={parsed.length === 0 || saving}
          >
            {saving ? 'Importing...' : `Import ${parsed.length} Card${parsed.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {/* Card list */}
      {cards.length > 0 && (
        <div className="manage-cards__list">
          <h2 className="manage-cards__list-title">Cards</h2>
          {cards.map(card => (
            <div
              key={card.id}
              className={`manage-cards__card-item ${editingId === card.id ? 'manage-cards__card-item--editing' : ''}`}
            >
              {editingId === card.id ? (
                // Inline edit mode
                <div className="manage-cards__edit-form">
                  <input
                    value={editFront}
                    onChange={e => setEditFront(e.target.value)}
                    className="form-field__input manage-cards__edit-input"
                    placeholder="English word"
                    autoFocus
                  />
                  <input
                    value={editBack}
                    onChange={e => setEditBack(e.target.value)}
                    className="form-field__input manage-cards__edit-input"
                    placeholder="Translation"
                  />
                  <input
                    value={editPos}
                    onChange={e => setEditPos(e.target.value)}
                    className="form-field__input manage-cards__edit-input"
                    placeholder="Part of speech"
                  />
                  <div className="manage-cards__edit-actions">
                    <button
                      className="manage-cards__edit-save"
                      onClick={handleSaveEdit}
                      disabled={!editFront.trim() || !editBack.trim() || saving}
                    >
                      Save
                    </button>
                    <button
                      className="manage-cards__edit-cancel"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="manage-cards__card-content">
                    <div className="manage-cards__card-front">
                      {card.front}
                      {card.part_of_speech && (
                        <span className="manage-cards__card-pos">{card.part_of_speech}</span>
                      )}
                    </div>
                    <div className="manage-cards__card-back">{card.back}</div>
                  </div>
                  <div className="manage-cards__card-actions">
                    <button
                      className="manage-cards__action-btn"
                      onClick={() => startEdit(card)}
                      aria-label="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="manage-cards__action-btn manage-cards__action-btn--danger"
                      onClick={() => handleDelete(card)}
                      aria-label="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M5 4V2H11V4M6 7V12M10 7V12M3 4L4 14H12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {cards.length === 0 && !loading && (
        <div className="manage-cards__empty">
          <p>No cards yet — start adding!</p>
        </div>
      )}
    </div>
  )
}
