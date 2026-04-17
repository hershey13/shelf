import './MatchedPassage.css'

// Anatomy labels — same values as fragmentIndex anatomy types
const ANATOMY_LABELS = {
  opening_line: 'opening line',
  dedication: 'dedication',
  epigraph: 'epigraph',
  body: 'passage',
  epilogue: 'epilogue',
  acknowledgments: 'acknowledgments',
}

// ─── MatchedPassage ────────────────────────────────────────────────────────────
//
//  @param {object} props
//    passage   — the text that was matched (e.g. the opening line)
//    query     — the user's original query (for word highlighting)
//    anatomy   — anatomy type string ('opening_line', 'dedication', etc.)
//    confidence — 0–1 score

export default function MatchedPassage({ passage, query, anatomy, confidence }) {
  if (!passage) return null

  const highlighted = highlightQueryWords(passage, query)
  const anatomyLabel = ANATOMY_LABELS[anatomy] || anatomy

  return (
    <div className="matched-passage">
      {anatomy && (
        <span className={`matched-passage__anatomy matched-passage__anatomy--${anatomy}`}>
          {anatomyLabel}
        </span>
      )}
      <p
        className="matched-passage__text"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  )
}

// ─── ConfidenceBar ─────────────────────────────────────────────────────────────
//
//  Visual confidence indicator — update your existing ConfidenceBar to accept
//  a `showLabel` prop, or use this standalone version.

export function ConfidenceBar({ confidence, showLabel = false }) {
  if (confidence === null || confidence === undefined) return null

  const pct = Math.round(confidence * 100)
  const level = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low'

  return (
    <div className={`confidence-bar confidence-bar--${level}`}>
      <div
        className="confidence-bar__fill"
        style={{ width: `${pct}%` }}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match confidence: ${pct}%`}
      />
      {showLabel && (
        <span className="confidence-bar__label">{pct}% match</span>
      )}
    </div>
  )
}

// ─── highlightQueryWords ───────────────────────────────────────────────────────
//
//  CONCEPT: Sanitised HTML injection
//  We use dangerouslySetInnerHTML to inject <mark> tags for highlighting.
//  This is safe here because we control the text source (our own corpus + API)
//  and we never inject user-typed content directly into the HTML.
//  We escape the passage text before injecting.

function highlightQueryWords(passage, query) {
  if (!query?.trim()) return escapeHtml(passage)

  // Extract meaningful query words (skip stop words and short words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'of', 'to', 'for', 'is', 'was', 'it'])
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // escape regex special chars

  if (!queryWords.length) return escapeHtml(passage)

  // Build a regex that matches any of the query words (case insensitive)
  const pattern = new RegExp(`(${queryWords.join('|')})`, 'gi')

  // Escape the passage HTML, then add mark tags for matches
  return escapeHtml(passage).replace(
    // Re-apply pattern after escaping
    new RegExp(`(${queryWords.map(w => escapeRegex(w)).join('|')})`, 'gi'),
    '<mark class="fragment-match">$1</mark>'
  )
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
