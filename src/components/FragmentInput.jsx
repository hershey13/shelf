import { useState, useEffect } from 'react'
import { getIndexStats } from '../search/fragmentIndex'
import './FragmentInput.css'

// Anatomy options — where in the book does the user think this passage is from?
const ANATOMY_OPTIONS = [
  { value: '',              label: 'anywhere in the book' },
  { value: 'opening_line', label: 'opening line' },
  { value: 'dedication',   label: 'dedication' },
  { value: 'epigraph',     label: 'epigraph' },
  { value: 'body',         label: 'body passage' },
]

// ─── FragmentInput ─────────────────────────────────────────────────────────────
//
//  @param {object} props
//    onSearch(query, anatomy) — called when user submits
//    placeholder              — custom placeholder text
//    autoFocus                — whether to focus on mount

export default function FragmentInput({ onSearch, placeholder, autoFocus = false }) {
  const [text, setText] = useState('')
  const [anatomy, setAnatomy] = useState('')
  const [stats, setStats] = useState(null)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    // Load index stats after mount — shows user how many passages are indexed
    const s = getIndexStats()
    setStats(s)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setText(val)
    setCharCount(val.length)
  }

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSearch(trimmed, anatomy)
  }

  function handleKeyDown(e) {
    // Cmd/Ctrl + Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handlePaste(e) {
    // When the user pastes, we strip any extra formatting and focus
    // No special handling needed — browser paste into textarea works fine
    // We just want to show a visual cue that paste was detected
    setTimeout(() => {
      const textarea = e.target
      textarea.style.setProperty('--paste-flash', '1')
      setTimeout(() => textarea.style.setProperty('--paste-flash', '0'), 300)
    }, 0)
  }

  const hasText = text.trim().length > 0
  const isLong = charCount > 200

  return (
    <div className="fragment-input">

      {/* ── Textarea ──────────────────────────────────────────────────────── */}
      <div className={`fragment-input__area ${hasText ? 'has-text' : ''}`}>
        <textarea
          className="fragment-input__textarea"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || 'Paste a quote, opening line, dedication, or any passage you remember…'}
          autoFocus={autoFocus}
          rows={5}
          spellCheck={false}
          aria-label="Fragment search input"
        />

        {/* Character count — appears when text is long */}
        {charCount > 50 && (
          <div className={`fragment-input__char-count ${isLong ? 'long' : ''}`}>
            {charCount} chars
          </div>
        )}
      </div>

      {/* ── Anatomy selector ──────────────────────────────────────────────── */}
      <div className="fragment-input__anatomy">
        <span className="fragment-input__anatomy-label">where in the book?</span>
        <div className="fragment-input__anatomy-pills">
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

      {/* ── Submit row ────────────────────────────────────────────────────── */}
      <div className="fragment-input__footer">
        <div className="fragment-input__hint">
          {stats && (
            <span className="fragment-input__stats">
              {stats.total.toLocaleString()} passages indexed
            </span>
          )}
          <span className="fragment-input__shortcut">⌘↵ to search</span>
        </div>

        <button
          className="fragment-input__submit"
          onClick={handleSubmit}
          disabled={!hasText}
          type="button"
        >
          find this book
        </button>
      </div>

      {/* ── Examples ──────────────────────────────────────────────────────── */}
      {!hasText && (
        <div className="fragment-input__examples">
          <p className="fragment-input__examples-label">try pasting something like:</p>
          <div className="fragment-input__example-list">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                className="fragment-input__example"
                onClick={() => setText(ex.text)}
                type="button"
              >
                <span className="example-anatomy">{ex.anatomy}</span>
                <span className="example-text">"{ex.text}"</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const EXAMPLES = [
  {
    anatomy: 'opening line',
    text: 'Last night I dreamt I went to Manderley again',
  },
  {
    anatomy: 'dedication',
    text: 'For everyone who felt too much',
  },
  {
    anatomy: 'opening line',
    text: 'It was a bright cold day in April and the clocks were striking thirteen',
  },
  {
    anatomy: 'epigraph',
    text: 'What is grief if not love persevering',
  },
]
