// src/hooks/useOCR.js
// Phase 4 — In-browser OCR using Tesseract.js
//
// INSTALL: npm install tesseract.js

import { useState, useCallback, useRef } from 'react'

// ─── Lazy Tesseract loader ─────────────────────────────────────────────────────
//  Avoids bundling Tesseract into the main chunk — only loads when first used.

let tesseractModule = null

async function getTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js')
  }
  return tesseractModule
}

// ─── preprocessImage ──────────────────────────────────────────────────────────
//
//  Strategy depends on the background tone detected from the image:
//
//  Light background (book pages, Kindle screenshots, dedications):
//    → Scale up, greyscale, then HARD THRESHOLD to pure black/white.
//      This eliminates paper texture and shadow that a contrast-boost
//      would amplify into stray characters ( |, \, random punctuation ).
//
//  Dark background (Instagram quote graphics, dark-mode Kindle):
//    → Invert first, then threshold. Tesseract reads dark-on-light best.
//
//  Scale target: 1800px on the long edge — Tesseract peaks around 300dpi.
//  Upscaling small images (phone crops, small screenshots) significantly
//  improves recognition on thin serif fonts.

async function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)

    img.onload = () => {
      const canvas = document.createElement('canvas')

      // Scale so longest edge hits 1800px; never shrink below original
      const scale = Math.max(1, 1800 / Math.max(img.width, img.height))
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data

      // Pass 1 — greyscale + measure average brightness
      let totalBrightness = 0
      for (let i = 0; i < d.length; i += 4) {
        const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        d[i] = d[i + 1] = d[i + 2] = grey
        totalBrightness += grey
      }
      const avgBrightness = totalBrightness / (d.length / 4)

      // Pass 2 — hard threshold to pure black / white
      //   Light image (avg > 160): ink = black, page = white
      //   Dark image  (avg ≤ 160): invert so text still becomes black
      const isLight    = avgBrightness > 160
      const threshold  = isLight ? 180 : 100

      for (let i = 0; i < d.length; i += 4) {
        const grey  = d[i]
        const pixel = isLight
          ? (grey < threshold ? 0 : 255)   // light bg: darks → ink
          : (grey > threshold ? 0 : 255)   // dark bg:  lights → ink
        d[i] = d[i + 1] = d[i + 2] = pixel
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(resolve, 'image/png')
      URL.revokeObjectURL(url)
    }

    img.src = url
  })
}

// ─── detectImageType ──────────────────────────────────────────────────────────
//
//  Returns one of: 'screenshot' | 'photo'
//  Used to pick the right Tesseract PSM:
//    PSM 6 — uniform text block  → screenshots, dedications, quote graphics
//    PSM 3 — auto layout detect  → physical book photos with varied margins

function detectImageType(imageFile) {
  const name = imageFile.name?.toLowerCase() || ''
  const isPng = imageFile.type === 'image/png'
  const hasScreenshotKeyword =
    name.includes('screenshot') ||
    name.includes('kindle')     ||
    name.includes('quote')      ||
    name.includes('snap')

  return isPng || hasScreenshotKeyword ? 'screenshot' : 'photo'
}

// ─── WHITELIST ────────────────────────────────────────────────────────────────
//
//  Only characters that can appear in real book text.
//  Kills the stray © § ¬ ~ ^ ` { } < > and random Unicode
//  that Tesseract hallucinates from stylised or serif fonts.
//
//  Uses \uXXXX escapes so no actual Unicode in source — safe for
//  all bundlers / parsers (fixes the Vite/oxc transform error).

const WHITELIST =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  '0123456789 ' +
  '.,!?\'"-;:()[]' +
  '\u2018\u2019' +   // ' '  curly single quotes
  '\u201C\u201D' +   // " "  curly double quotes
  '\u2014\u2013' +   // — –  em/en dash
  '\u2026' +         // …    ellipsis
  '\n'

// ─── useOCR ───────────────────────────────────────────────────────────────────
//
//  Public API:
//    extractText(imageFile)  — run OCR on a File object
//    reset()                 — clear all state
//
//  Returned state:
//    text        — cleaned extracted string
//    confidence  — 0–100 Tesseract score
//    progress    — 0–1 float for a progress bar
//    status      — 'idle' | 'loading' | 'processing' | 'done' | 'error'
//    error       — string message or null

export function useOCR() {
  const [text,       setText]       = useState('')
  const [confidence, setConfidence] = useState(null)
  const [progress,   setProgress]   = useState(0)
  const [status,     setStatus]     = useState('idle')
  const [error,      setError]      = useState(null)

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

      // createWorker(lang, oem, options)
      //   OEM 1 = LSTM neural net (best accuracy, default in v5)
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core')       setProgress(0.10)
          if (m.status === 'initializing tesseract')       setProgress(0.20)
          if (m.status === 'loading language traineddata') setProgress(0.35)
          if (m.status === 'recognizing text') {
            setProgress(0.4 + (m.progress ?? 0) * 0.6)
          }
        },
      })

      workerRef.current = worker

      // ── Apply Tesseract parameters AFTER worker is ready ──────────────
      //
      //  In Tesseract.js v5 the correct way to set engine params is
      //  worker.setParameters(). Passing them as a third arg to recognize()
      //  is not supported and silently ignored (or throws in strict mode).
      //
      //  PSM values are integers, not strings.

      const imageType = detectImageType(imageFile)
      await worker.setParameters({
        tessedit_pageseg_mode:    imageType === 'screenshot' ? 6 : 3,
        tessedit_char_whitelist:  WHITELIST,
        preserve_interword_spaces: '1',
        user_defined_dpi:          '300',
      })

      setStatus('processing')

      // Preprocess: greyscale + hard threshold → gives Tesseract clean B&W
      const processedBlob = await preprocessImage(imageFile)
      const imageUrl      = URL.createObjectURL(processedBlob)

      const result = await worker.recognize(imageUrl)

      URL.revokeObjectURL(imageUrl)

      const cleanedText = postProcessOCR(result.data.text)

      setText(cleanedText)
      setConfidence(result.data.confidence)
      setProgress(1)
      setStatus('done')

      await worker.terminate()
      workerRef.current = null

    } catch (err) {
      console.error('[useOCR] Error:', err)
      setError(
        'Could not read text from this image. ' +
        'Try a clearer photo or type the text manually.'
      )
      setStatus('error')
      setProgress(0)

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

// ─── postProcessOCR ───────────────────────────────────────────────────────────
//
//  The threshold preprocessing removes most noise at the image level.
//  The whitelist removes most garbage characters at the Tesseract level.
//  These rules catch whatever still slips through.

function postProcessOCR(raw) {
  if (!raw) return ''

  return raw
    // 1. Fix common Unicode ligatures Tesseract emits as single glyphs
    .replace(/\uFB01/g, 'fi')   // ﬁ
    .replace(/\uFB02/g, 'fl')   // ﬂ
    .replace(/\uFB03/g, 'ffi')  // ﬃ
    .replace(/\uFB00/g, 'ff')   // ﬀ

    // 2. Strip any remaining characters outside normal book text
    //    (belt-and-suspenders after the whitelist)
    .replace(/[^\w\s.,!?'";\-:()\[\]\u2018\u2019\u201C\u201D\u2014\u2013\u2026]/g, '')

    // 3. Pipe and backslash are always OCR noise on book text
    .replace(/\s*[|\\]\s*/g, ' ')

    // 4. Lone lowercase "l" misread as capital "I"
    //    (most common Tesseract confusion on serif fonts)
    .replace(/\bl\b/g, 'I')

    // 5. Curly → straight quotes (simpler for downstream search)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')

    // 6. Em/en dash → hyphen
    .replace(/[\u2013\u2014]/g, '-')

    // 7. Ellipsis glyph → three dots
    .replace(/\u2026/g, '...')

    // 8. Collapse multiple spaces/tabs to one (preserve newlines)
    .replace(/[ \t]+/g, ' ')

    // 9. Merge single newlines into the surrounding sentence.
    //    Double-newlines (paragraph breaks) are preserved.
    .replace(/([^\n])\n([^\n])/g, '$1 $2')

    // 10. Collapse 3+ blank lines to a single paragraph break
    .replace(/\n{3,}/g, '\n\n')

    // 11. Drop lines that are clearly noise:
    //     - under 3 chars
    //     - pure digits (page numbers)
    //     - no letters at all (punctuation-only lines)
    .split('\n')
    .filter(line => {
      const t = line.trim()
      if (t.length < 3)              return false
      if (/^\d+$/.test(t))           return false  // page number
      if (!/[a-zA-Z]/.test(t))       return false  // no letters
      return true
    })
    .join('\n')

    .trim()
}