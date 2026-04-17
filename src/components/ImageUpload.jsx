// src/components/ImageUpload.jsx
// Phase 4 — Image upload with drag-and-drop

import { useState, useRef, useCallback } from 'react'
import './ImageUpload.css'

// Input types shelf accepts — shown as hints to the user
const INPUT_TYPES = [
  { icon: '📱', label: 'Kindle screenshot' },
  { icon: '📸', label: 'photo of a page' },
  { icon: '🖼️', label: 'quote graphic' },
  { icon: '📔', label: 'book cover' },
]

// ─── ImageUpload ───────────────────────────────────────────────────────────────
//
//  @param {object} props
//    onImage(file)  — called with a File when user selects/drops an image
//    disabled       — disables interaction while OCR is running

export default function ImageUpload({ onImage, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null) // base64 preview URL
  const inputRef = useRef(null)

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return

    // Generate a preview so the user can see what they uploaded
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    onImage(file)
  }, [onImage])

  // ── Input change ──────────────────────────────────────────────────────────

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  // ── Drag and drop ─────────────────────────────────────────────────────────

  function handleDragOver(e) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(e) {
    // Only clear dragging if leaving the drop zone entirely (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Paste from clipboard ──────────────────────────────────────────────────
  // CONCEPT: clipboard paste
  // On desktop, users often have a screenshot in their clipboard.
  // Listening to the paste event on the drop zone lets them Ctrl+V directly.

  function handlePaste(e) {
    if (disabled) return
    const items = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) handleFile(file)
    }
  }

  function handleClear() {
    setPreview(null)
  }

  return (
    <div className="image-upload">

      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      {!preview ? (
        <div
          className={`image-upload__dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => !disabled && inputRef.current?.click()}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Upload an image"
          onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        >
          <div className="image-upload__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>

          <p className="image-upload__cta">
            drop an image, click to browse, or paste from clipboard
          </p>

          <div className="image-upload__types">
            {INPUT_TYPES.map(t => (
              <span key={t.label} className="image-upload__type">
                {t.label}
              </span>
            ))}
          </div>
        </div>
      ) : (

        /* ── Preview state ────────────────────────────────────────────────── */
        <div className="image-upload__preview">
          <img
            src={preview}
            alt="Uploaded for OCR"
            className="image-upload__preview-img"
          />
          {!disabled && (
            <button
              className="image-upload__clear"
              onClick={handleClear}
              aria-label="Remove image"
              type="button"
            >
              ✕ use a different image
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="image-upload__input"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
