// src/hooks/useOCR.js
// Phase 4 — In-browser OCR using Tesseract.js
//
// INSTALL: npm install tesseract.js

import { useState, useCallback, useRef } from 'react'

let tesseractModule = null

async function getTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js')
  }
  return tesseractModule
}

// ─── preprocessImage ──────────────────────────────────────────────────────────
//
//  The strategy depends on the background tone of the image:
//
//  Light background (book pages, screenshots, dedications):
//    — Scale up, convert to greyscale, then THRESHOLD (not contrast-boost).
//      Thresholding turns the image black-and-white cleanly. This removes
//      paper texture and shadow that a contrast boost would amplify into noise.
//
//  Dark background (Instagram quote graphics, dark-mode Kindle):
//    — Invert first, then threshold. Tesseract reads dark-on-light better.
//
//  The old approach (grey * 0.7 / grey * 1.4) was fine for high-contrast
//  images but destroyed light pages by pushing paper grain into mid-grey,
//  which Tesseract reads as stray characters (|, \, random punctuation).

async function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.max(1, 1800 / Math.max(img.width, img.height))
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data

      // Pass 1: convert to greyscale + sample average brightness
      let totalBrightness = 0
      for (let i = 0; i < d.length; i += 4) {
        const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        d[i] = d[i + 1] = d[i + 2] = grey
        totalBrightness += grey
      }
      const avgBrightness = totalBrightness / (d.length / 4)

      // Pass 2: threshold
      // Light image (avg > 160): pixels below threshold → black (ink),
      //   pixels above → white (page). Paper texture disappears entirely.
      // Dark image (avg <= 160): invert logic so text still becomes black.
      const isLight = avgBrightness > 160
      const threshold = isLight ? 180 : 100

      for (let i = 0; i < d.length; i += 4) {
        const grey = d[i]
        const pixel = isLight
          ? (grey < threshold ? 0 : 255)
          : (grey > threshold ? 0 : 255)
        d[i] = d[i + 1] = d[i + 2] = pixel
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(resolve, 'image/png')
      URL.revokeObjectURL(url)
    }

    img.src = url
  })
}

// ─── getTesseractConfig ────────────────────────────────────────────────────────
//
//  PSM (Page Segmentation Mode):
//    3 = fully automatic — good for physical pages with varied layout
//    6 = uniform block of text — best for dedications, quote pages, screenshots
//    7 = single text line — for one-liners
//
//  Screenshots and PNG quote images are almost always a clean text block → PSM 6.

function getTesseractConfig(imageFile) {
  const name = imageFile.name?.toLowerCase() || ''
  const isScreenshot =
    imageFile.type === 'image/png' ||
    name.includes('screenshot') ||
    name.includes('kindle') ||
    name.includes('quote')

  return {
    tessedit_pageseg_mode: isScreenshot ? '6' : '3',
    preserve_interword_spaces: '1',
  }
}

// ─── useOCR ───────────────────────────────────────────────────────────────────

export function useOCR() {
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
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

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core')       setProgress(0.1)
          if (m.status === 'initializing tesseract')       setProgress(0.2)
          if (m.status === 'loading language traineddata') setProgress(0.35)
          if (m.status === 'recognizing text') {
            setProgress(0.4 + m.progress * 0.6)
          }
        },
      })

      workerRef.current = worker
      setStatus('processing')

      const processedBlob = await preprocessImage(imageFile)
      const imageUrl = URL.createObjectURL(processedBlob)

      const result = await worker.recognize(imageUrl, {}, {
        ...getTesseractConfig(imageFile),
      })

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
      setError('Could not read text from this image. Try a clearer photo or type the text manually.')
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

// ─── postProcessOCR ────────────────────────────────────────────────────────────
//
//  The thresholding above removes most noise at source. These rules catch
//  whatever slips through.

function postProcessOCR(raw) {
  if (!raw) return ''
  return raw
    // Ligatures
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi').replace(/ﬀ/g, 'ff')
    // Pipe and backslash are always OCR noise on book text, never real characters
    .replace(/\s*[|\\]\s*/g, ' ')
    // Lone "l" → "I" (Tesseract's most common confusion)
    .replace(/\bl\b/g, 'I')
    // Smart quotes → straight
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Em/en dashes → hyphen
    .replace(/[\u2013\u2014]/g, '-')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    // Collapse single newlines into spaces, preserve paragraph breaks
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}