// src/hooks/useOCR.js
// Phase 4 — In-browser OCR using Tesseract.js
//
// CONCEPT: What is Tesseract.js and why does it run in the browser?
//
// Tesseract is an OCR engine (Optical Character Recognition) — it reads
// text out of images. Tesseract.js is the same engine compiled to WebAssembly
// so it runs entirely inside the browser. No server, no API key, no cost.
//
// The tradeoff vs cloud OCR (Google Vision, AWS Textract):
//   Tesseract.js  — free, private, works offline, slower, lower accuracy on
//                   stylised fonts and curved pages
//   Cloud OCR     — costs per request, needs backend, faster, near-perfect
//                   accuracy on everything including handwriting
//
// For shelf's MVP, Tesseract.js is exactly right:
// — Kindle screenshots and quote graphics (clean text) → very high accuracy
// — Physical page photos (good lighting) → good accuracy
// — Decorative fonts / dark backgrounds → passable, user corrects in confirm step
//
// The "confirm before search" step is non-optional precisely because OCR
// isn't perfect. The user always sees and can edit what was extracted.
//
// INSTALL: npm install tesseract.js

import { useState, useCallback, useRef } from 'react'

// We import Tesseract lazily (only when needed) so it doesn't bloat
// the initial page load. Tesseract's WASM files are ~10MB.
let tesseractModule = null

async function getTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js')
  }
  return tesseractModule
}

// ─── useOCR ───────────────────────────────────────────────────────────────────
//
//  @returns {object}
//    extractText(imageFile)  — call this with a File object from an <input>
//    text                    — the extracted text string
//    confidence              — 0–100 OCR confidence score from Tesseract
//    progress                — 0–1 loading/processing progress
//    status                  — 'idle' | 'loading' | 'processing' | 'done' | 'error'
//    error                   — error message if status === 'error'
//    reset                   — clears all state back to idle

export function useOCR() {
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle | loading | processing | done | error
  const [error, setError] = useState(null)

  const workerRef = useRef(null)

  const extractText = useCallback(async (imageFile) => {
    if (!imageFile) return

    setStatus('loading')
    setProgress(0)
    setError(null)
    setText('')
    setConfidence(null)

    try {
      const { createWorker } = await getTesseract()

      // Create a Tesseract worker — this downloads the language data (~4MB)
      // and initialises the WASM engine. Only happens once per session.
      //
      // CONCEPT: Why a "worker"?
      // OCR is CPU-intensive. Running it on the main thread would freeze the UI.
      // A worker runs in a separate thread, so your app stays responsive.
      // Tesseract.js handles all of this automatically.

      const worker = await createWorker('eng', 1, {
        // Progress callback — called multiple times during processing
        // logger: (m) => ... — we use the progress events instead
      })

      workerRef.current = worker

      setStatus('processing')

      // Convert File to a URL that Tesseract can read
      const imageUrl = URL.createObjectURL(imageFile)

      // Run OCR
      // CONCEPT: Tesseract returns a "data" object with:
      //   data.text       — the extracted text
      //   data.confidence — 0-100 average confidence across all words
      //   data.words      — array of word-level results with individual confidences

      const result = await worker.recognize(imageUrl)

      // Clean up the temporary URL
      URL.revokeObjectURL(imageUrl)

      // Post-process the extracted text
      const cleanedText = postProcessOCR(result.data.text)

      setText(cleanedText)
      setConfidence(result.data.confidence)
      setProgress(1)
      setStatus('done')

      // Terminate the worker to free memory
      await worker.terminate()
      workerRef.current = null

    } catch (err) {
      console.error('[useOCR] Error:', err)
      setError('Could not read text from this image. Try a clearer photo or type the text manually.')
      setStatus('error')
      setProgress(0)

      // Clean up worker on error too
      if (workerRef.current) {
        await workerRef.current.terminate().catch(() => {})
        workerRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    setText('')
    setConfidence(null)
    setProgress(0)
    setStatus('idle')
    setError(null)
  }, [])

  return { extractText, text, confidence, progress, status, error, reset }
}

// ─── postProcessOCR ────────────────────────────────────────────────────────────
//
//  CONCEPT: Why clean the OCR output?
//  Tesseract returns raw text with common artefacts:
//  — extra newlines and spaces from page layout detection
//  — stray punctuation from image borders/watermarks
//  — ligatures misread as separate characters (ﬁ → fi)
//
//  We clean these before showing to the user.

function postProcessOCR(raw) {
  if (!raw) return ''

  return raw
    // Collapse multiple spaces/newlines into single space
    .replace(/\s+/g, ' ')
    // Fix common Tesseract ligature errors
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬀ/g, 'ff')
    // Remove leading/trailing whitespace
    .trim()
}