// import { useBookSearch } from '../hooks/useBookSearch'
// import BookCard from '../components/BookCard'
// import BookFlipLoader from '../components/BookFlipLoader'
// import ReturnHome from '../components/ReturnHome'
// import AnatomyFilter from '../components/AnatomyFilter'
// import './SearchResults.css'

// export default function SearchResults({ searchState, onBack, onBookSelect }) {
//   const {
//     mode = 'vibe',
//     query = '',
//     tags = [],
//     anatomy = '',
//   } = searchState || {}

//   const { results, loading, error, source, refetch } = useBookSearch({
//     mode,
//     query,
//     tags,
//     anatomy,
//     enabled: !!(query?.trim() || tags?.length),
//   })

//   if (loading) {
//       return <BookFlipLoader />
//     }

//   return (
//      <div className="search-results-page" style={{ position: 'relative' }}>
    
//           {/* ── Return Home button ─────────────────────────────────────────────── */}
//           <ReturnHome onClick={onBack} variant="corner" />
    
//           {/* ── Results header ─────────────────────────────────────────────────── */}
//           <div className="results-header">
//             <div className="query-summary">
//               <span className="mode-label">{formatMode(mode)}</span>
//               {query && <span className="query-text">"{query}"</span>}
//               {tags.length > 0 && (
//                 <div className="tag-list">
//                   {tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
//                 </div>
//               )}
//             </div>
//         {source === 'mock_fallback' && (
//           <div className="source-notice">showing sample results</div>
//         )}
//       </div>

//       {loading && (
//         <div className="results-grid">
//           {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
//         </div>
//       )}

//       {!loading && error && (
//         <div className="error-state">
//           <p className="error-message">{error}</p>
//           <button className="retry-btn" onClick={refetch}>try again</button>
//         </div>
//       )}

//       {!loading && !error && results.length === 0 && (
//         <div className="empty-state">
//           <p>no books found.</p>
//           <button className="retry-btn" onClick={onBack}>← adjust search</button>
//         </div>
//       )}

//       {!loading && results.length > 0 && (
//         <>
//           <p className="results-count">{results.length} books found</p>
//           <div className="results-grid">
//             {results.map(book => (
//               <BookCard key={book.id} book={book} onClick={() => onBookSelect(book)} />
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   )
// }

// function SkeletonCard() {
//   return (
//     <div className="book-card skeleton-card" aria-hidden="true">
//       <div className="skeleton skeleton-cover" />
//       <div className="skeleton-body">
//         <div className="skeleton skeleton-title" />
//         <div className="skeleton skeleton-author" />
//         <div className="skeleton skeleton-bar" />
//       </div>
//     </div>
//   )
// }

// function formatMode(mode) {
//   const labels = {
//     vibe: 'vibe search', fragment: 'fragment',
//     mood_board: 'mood board', image: 'image search',
//     epilogue: 'epilogue', special_mentions: 'special mentions',
//   }
//   return labels[mode] || mode
// }

// src/pages/SearchResults.jsx — redesigned

import { useBookSearch } from '../hooks/useBookSearch'
import BookFlipLoader from '../components/BookFlipLoader'
import './SearchResults.css'

export default function SearchResults({ searchState, onBack, onBookSelect }) {
  const {
    mode = 'vibe',
    query = '',
    tags = [],
    anatomy = '',
  } = searchState || {}

  const { results, loading, error, source, refetch } = useBookSearch({
    mode,
    query,
    tags,
    anatomy,
    enabled: !!(query?.trim() || tags?.length),
  })

  if (loading) return <BookFlipLoader />

  return (
    <div className="sr-page">
      <div className="sr-bg" aria-hidden="true" />

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <header className="sr-header">
        <button className="sr-back" onClick={onBack} aria-label="Return home">
          <span className="sr-back__arrow">←</span>
          <span className="sr-back__label">Return Home</span>
        </button>
        <div className="sr-header__center">
          <span className="sr-header__wordmark">shelf</span>
        </div>
        <div className="sr-header__right" />
      </header>

      {/* ── Query summary strip ──────────────────────────────────────────── */}
      <div className="sr-summary">
        <div className="sr-summary__inner">
          <span className="sr-summary__mode">{formatMode(mode)}</span>
          <span className="sr-summary__divider">·</span>
          {query && <span className="sr-summary__query">"{cleanText(query)}"</span>}
          {tags.length > 0 && (
            <div className="sr-summary__tags">
              {tags.map(tag => (
                <span key={tag} className="sr-summary__tag">{tag.replace(/-/g, ' ')}</span>
              ))}
            </div>
          )}
          {results.length > 0 && (
            <span className="sr-summary__count">{results.length} books</span>
          )}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="sr-main">

        {error && (
          <div className="sr-empty">
            <div className="sr-empty__glyph">⊘</div>
            <p className="sr-empty__title">something went wrong</p>
            <p className="sr-empty__sub">{error}</p>
            <button className="sr-btn" onClick={refetch}>try again</button>
          </div>
        )}

        {!error && results.length === 0 && (
          <div className="sr-empty">
            <div className="sr-empty__glyph">✦</div>
            <p className="sr-empty__title">no books found</p>
            <p className="sr-empty__sub">try rephrasing, or switch to a different search mode</p>
            <button className="sr-btn" onClick={onBack}>← adjust search</button>
          </div>
        )}

        {results.length > 0 && (
          <div className="sr-grid">
            {results.map((book, i) => (
              <ResultCard key={book.id} book={book} index={i} onClick={() => onBookSelect(book)} />
            ))}
          </div>
        )}

        {source === 'mock_fallback' && results.length > 0 && (
          <p className="sr-fallback-notice">showing sample results — live data unavailable</p>
        )}
      </main>
    </div>
  )
}

function ResultCard({ book, index, onClick }) {
  const snippet = cleanText(book.snippet || book.matchedText || book.firstSentence || '')
  const desc = cleanText(book.description || book.synopsis || '')
  const shortDesc = desc.length > 180 ? desc.slice(0, 180) + '…' : desc
  const shortSnippet = snippet.length > 130 ? snippet.slice(0, 130) + '…' : snippet

  return (
    <article
      className="sr-card"
      style={{ animationDelay: `${index * 0.055}s` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="sr-card__cover-wrap">
        {book.cover ? (
          <img className="sr-card__cover" src={book.cover} alt="" loading="lazy" />
        ) : (
          <div className="sr-card__cover-placeholder">
            <span className="sr-card__initial">{(book.title || '?')[0]}</span>
          </div>
        )}
        <div className="sr-card__hover-cta" aria-hidden="true">open book</div>
      </div>

      <div className="sr-card__body">
        <h2 className="sr-card__title">{cleanText(book.title)}</h2>
        <p className="sr-card__author">
          — <em>{cleanText(book.author)}</em>
          {book.year && <span className="sr-card__year">, {book.year}</span>}
        </p>

        {shortDesc && <p className="sr-card__desc">{shortDesc}</p>}

        {shortSnippet && shortSnippet !== shortDesc && (
          <blockquote className="sr-card__snippet">
            <span className="sr-card__snippet-label">opens with</span>
            "{shortSnippet}"
          </blockquote>
        )}

        {book.moods?.length > 0 && (
          <div className="sr-card__moods">
            {book.moods.slice(0, 3).map(mood => (
              <span key={mood} className="sr-card__mood">{mood}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function formatMode(mode) {
  const labels = {
    vibe: 'vibe search', fragment: 'fragment', mood: 'mood board',
    mood_board: 'mood board', image: 'image search',
    epilogue: 'epilogue', special: 'special mentions', special_mentions: 'special mentions',
  }
  return labels[mode] || mode
}

function cleanText(str) {
  if (!str) return ''
  return str
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '').trim()
}
