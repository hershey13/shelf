import "./BookCard.css";
import MatchedPassage, { ConfidenceBar } from './MatchedPassage'
import './MatchedPassage.css'

export default function BookCard({ book, onSelect, rank }) {
  const score = book.score ? Math.round(book.score * 100) : null;

  // Safe fallbacks — mock books have tags/opening, API books may not
  const tags    = book.tags    || book.moods    || []
  const opening = book.opening || book.firstSentence || book.snippet || null
  const synopsis = book.synopsis || book.description || null

  return (
    <div className="book-card" onClick={() => onSelect(book)}>
      <div className="book-card__spine" style={{ background: book.coverColor || "#2c1a08" }} />

      <div className="book-card__cover" style={{ background: book.coverColor || "#2c1a08" }}>
        {/* Real cover image if available from API */}
        {book.cover && (
          <img
            src={book.cover}
            alt={book.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}
        <div className="cover-inner">
          <div className="cover-inner__rank">{rank}</div>
          <div className="cover-inner__title">{book.title}</div>
          <div className="cover-inner__author">{book.author}</div>
        </div>
        <div className="cover-inner__year">{book.year}</div>
      </div>

      <div className="book-card__info">
        <div className="book-card__meta">
          <span className="book-card__title">{book.title}</span>
          <span className="book-card__author">— {book.author}{book.year ? `, ${book.year}` : ''}</span>
        </div>

        {/* Synopsis — hidden when matched passage is shown */}
        {synopsis && !book.matchedText && (
          <p className="book-card__synopsis">
            {synopsis.slice(0, 140)}…
          </p>
        )}

        {/* Phase 3: matched fragment passage */}
        {book.matchedText && (
          <MatchedPassage
            passage={book.matchedText}
            query={book._query}
            anatomy={book.anatomy}
            confidence={book.confidence}
          />
        )}

        {/* Confidence bar */}
        {book.confidence != null && (
          <ConfidenceBar confidence={book.confidence} />
        )}

        {/* Tags — falls back to moods from API results */}
        {tags.length > 0 && (
          <div className="book-card__tags">
            {tags.slice(0, 4).map(tag => (
              <span key={tag} className="book-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Match reason */}
        {(book.matchReason || score) && (
          <div className="book-card__match">
            <span className="match-icon">✦</span>
            {book.matchReason && <span className="match-reason">{book.matchReason}</span>}
            {score && <span className="match-score">{score}% match</span>}
          </div>
        )}

        {/* Opening line — only shown when available */}
        {opening && (
          <div className="book-card__opening">
            <span className="opening-label">opens with: </span>
            <em>"{opening.slice(0, 80)}…"</em>
          </div>
        )}
      </div>

      <div className="book-card__arrow">→</div>
    </div>
  );
}

export { MatchedPassage, ConfidenceBar }
