import { useBookSearch } from '../hooks/useBookSearch'
import BookCard from '../components/BookCard'
import AnatomyFilter from '../components/AnatomyFilter'
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

  return (
    <div className="search-results-page">
      <div className="results-header">
        <button className="back-btn" onClick={onBack}>← back</button>
        <div className="query-summary">
          <span className="mode-label">{formatMode(mode)}</span>
          {query && <span className="query-text">"{query}"</span>}
          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
            </div>
          )}
        </div>
        {source === 'mock_fallback' && (
          <div className="source-notice">showing sample results</div>
        )}
      </div>

      {loading && (
        <div className="results-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={refetch}>try again</button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="empty-state">
          <p>no books found.</p>
          <button className="retry-btn" onClick={onBack}>← adjust search</button>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="results-count">{results.length} books found</p>
          <div className="results-grid">
            {results.map(book => (
              <BookCard key={book.id} book={book} onClick={() => onBookSelect(book)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="book-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-cover" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-author" />
        <div className="skeleton skeleton-bar" />
      </div>
    </div>
  )
}

function formatMode(mode) {
  const labels = {
    vibe: 'vibe search', fragment: 'fragment',
    mood_board: 'mood board', image: 'image search',
    epilogue: 'epilogue', special_mentions: 'special mentions',
  }
  return labels[mode] || mode
}