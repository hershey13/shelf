import { useState, useEffect } from 'react'
import './OCRConfirm.css'

const ANATOMY_OPTIONS = [
  { value: '',              label: 'anywhere in the book' },
  { value: 'opening_line', label: 'opening line' },
  { value: 'dedication',   label: 'dedication' },
  { value: 'epigraph',     label: 'epigraph' },
  { value: 'body',         label: 'body passage' },
]

// Confidence level labels shown to the user
function confidenceLabel(score) {
  if (score === null || score === undefined) return null
  if (score >= 80) return { label: 'high confidence', color: 'green' }
  if (score >= 55) return { label: 'medium confidence — check for errors', color: 'amber' }
  return { label: 'low confidence — please correct errors', color: 'red' }
}

// ─── OCRConfirm ───────────────────────────────────────────────────────────────
//
//  @param {object} props
//    extractedText   — raw text from Tesseract
//    ocrConfidence   — 0–100 score from Tesseract
//    onConfirm(text, anatomy)  — called when user clicks "search"
//    onBack          — called when user wants to upload a different image

export default function OCRConfirm({ extractedText, ocrConfidence, onConfirm, onBack }) {
  const [text, setText] = useState(extractedText || '')
  const [anatomy, setAnatomy] = useState('')

  // Sync if extractedText changes (e.g. user uploads a new image)
  useEffect(() => {
    setText(extractedText || '')
  }, [extractedText])

  const conf = confidenceLabel(ocrConfidence)
  const hasText = text.trim().length > 0

  function handleSearch() {
    if (!hasText) return
    onConfirm(text.trim(), anatomy)
  }

  return (
    <div className="ocr-confirm">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="ocr-confirm__header">
        <div className="ocr-confirm__title">
          text extracted — check it looks right
        </div>
        {conf && (
          <span className={`ocr-confirm__confidence ocr-confirm__confidence--${conf.color}`}>
            {conf.label}
          </span>
        )}
      </div>

      {/* ── Editable extracted text ───────────────────────────────────────── */}
      <textarea
        className="ocr-confirm__textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
        spellCheck={true}
        aria-label="Edit extracted text before searching"
        autoFocus
      />

      <p className="ocr-confirm__hint">
        edit any errors above, then choose where in the book this is from
      </p>

      {/* ── Anatomy selector ─────────────────────────────────────────────── */}
      <div className="ocr-confirm__anatomy">
        <span className="ocr-confirm__anatomy-label">where in the book?</span>
        <div className="ocr-confirm__anatomy-pills">
          {ANATOMY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`anatomy-pill ${anatomy === opt.value ? 'active' : ''}`}
              onClick={() => setAnatomy(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="ocr-confirm__actions">
        <button
          className="ocr-confirm__back"
          onClick={onBack}
          type="button"
        >
          ← different image
        </button>
        <button
          className="ocr-confirm__search"
          onClick={handleSearch}
          disabled={!hasText}
          type="button"
        >
          search for this book
        </button>
      </div>
    </div>
  )
}
