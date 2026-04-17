import { useState } from 'react'
import ImageUpload from './ImageUpload'
import OCRConfirm from './OCRConfirm'
import { useOCR } from '../hooks/useOCR'
import './ImageSearch.css'

export default function ImageSearch({ onSearch }) {
  const [step, setStep] = useState('upload') // 'upload' | 'processing' | 'confirm'
  const { extractText, text, confidence, progress, status, error, reset } = useOCR()

  // ── Step 1 → 2: User picks an image ─────────────────────────────────────

  async function handleImage(file) {
    setStep('processing')
    await extractText(file)
    setStep('confirm')
  }

  // ── Step 3 → search: User confirms the text ──────────────────────────────

  function handleConfirm(confirmedText, anatomy) {
    onSearch({
      mode: 'image',
      query: confirmedText,
      tags: [],
      anatomy,
    })
  }

  // ── Back: reset to upload ─────────────────────────────────────────────────

  function handleBack() {
    reset()
    setStep('upload')
  }

  // ── Error: show message, let user try again ───────────────────────────────

  if (step === 'processing' && status === 'error') {
    return (
      <div className="image-search">
        <div className="image-search__error">
          <p className="image-search__error-text">{error}</p>
          <button className="image-search__retry" onClick={handleBack} type="button">
            ← try a different image
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="image-search">

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <ImageUpload
          onImage={handleImage}
          disabled={false}
        />
      )}

      {/* ── Step 2: Processing ──────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="image-search__processing">
          <div className="image-search__spinner" aria-hidden="true" />
          <p className="image-search__processing-text">
            {status === 'loading' ? 'loading OCR engine…' : 'reading text from image…'}
          </p>
          <div className="image-search__progress-track">
            <div
              className="image-search__progress-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="image-search__processing-hint">
            this runs in your browser — nothing is uploaded to any server
          </p>
        </div>
      )}

      {/* ── Step 3: Confirm ────────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <OCRConfirm
          extractedText={text}
          ocrConfidence={confidence}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
