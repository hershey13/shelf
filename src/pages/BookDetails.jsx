import "./BookDetails.css";
import ReturnHome from '../components/ReturnHome'

export default function BookDetails({ book, onBack, onSearch }) {
  if (!book) return null;

  // Defensive defaults — API results may omit these arrays entirely
  const genres = book.genres ?? [];
  const mood   = book.mood   ?? [];
  const tags   = book.tags   ?? [];

  const anatomySections = [
    { id: "epigraph",   label: "Epigraph",     icon: "◈", content: book.epigraph   },
    { id: "dedication", label: "Dedication",   icon: "☽", content: book.dedication },
    { id: "opening",    label: "Opening line", icon: "✦", content: book.opening    },
  ].filter(s => s.content);

  return (
    <div className="book-details">
      <div className="details__bg" />

      {/* Nav */}
      <div className="details__nav">
        <button className="details__back" onClick={onBack}>← back to results</button>
        <div className="details__wordmark">shelf</div>
        <button className="details__new-search" onClick={onSearch}>new search →</button>
      </div>

      {/* Hero */}
      <div className="details__hero">
        <div
          className="details__cover"
          style={{ background: book.coverColor || "#2c1a08" }}
        >
          <div className="details-cover__border" />
          <div className="details-cover__content">
            <div className="details-cover__ornament">✦</div>
            <div className="details-cover__title">{book.title}</div>
            <div className="details-cover__rule"><span>◆</span></div>
            <div className="details-cover__author">{book.author}</div>
            <div className="details-cover__year">{book.year}</div>
          </div>
        </div>

        <div className="details__hero-info">
          {genres.length > 0 && (
            <div className="details__genre-tags">
              {genres.map(g => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>
          )}

          <h1 className="details__title">{book.title}</h1>
          <p className="details__author">by {book.author}</p>

          <div className="details__stats">
            <span className="stat"><span className="stat__label">year</span> {book.year}</span>
            {book.pages && <>
              <span className="stat__divider">·</span>
              <span className="stat"><span className="stat__label">pages</span> {book.pages}</span>
            </>}
            {book.rating && <>
              <span className="stat__divider">·</span>
              <span className="stat"><span className="stat__label">rating</span> {book.rating} / 5</span>
            </>}
          </div>

          {book.synopsis && <p className="details__synopsis">{book.synopsis}</p>}

          {mood.length > 0 && (
            <div className="details__mood-tags">
              {mood.map(m => (
                <span key={m} className="mood-chip">{m}</span>
              ))}
            </div>
          )}

          {book.matchReason && (
            <div className="details__match-reason">
              <span className="match-icon">✦</span>
              <span>{book.matchReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Anatomy sections */}
      {anatomySections.length > 0 && (
        <div className="details__anatomy">
          <div className="anatomy__header">
            <span className="anatomy__rule">⸻</span>
            <span className="anatomy__title">inside the book</span>
            <span className="anatomy__rule">⸻</span>
          </div>
          <div className="anatomy__grid">
            {anatomySections.map(section => (
              <div key={section.id} className="anatomy-section">
                <div className="anatomy-section__label">
                  <span className="anatomy-section__icon">{section.icon}</span>
                  {section.label}
                </div>
                <blockquote className="anatomy-section__text">
                  "{section.content}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="details__tags-block">
          <div className="tags-block__header">themes &amp; tropes</div>
          <div className="tags-block__list">
            {tags.map(tag => (
              <span key={tag} className="detail-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="details__footer">
        <div className="footer__ornament">◆ ◆ ◆</div>
        <p className="footer__cta-text">Looking for something similar?</p>
        <button className="footer__cta-btn" onClick={onSearch}>
          search by vibe or mood →
        </button>
      </div>
    </div>
  );
}
