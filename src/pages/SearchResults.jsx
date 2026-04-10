import BookCard from "../components/BookCard";
import "./SearchResults.css";

const MODE_LABELS = {
  fragment: "Fragment search",
  vibe: "Vibe search",
  mood: "Mood board",
  image: "Image search",
  epilogue: "Epilogue search",
  special: "Special mentions",
};

export default function SearchResults({ searchState, onBack, onBookSelect }) {
  const { query, mode, tags, results, modeLabel } = searchState || {};
  const hasResults = results && results.length > 0;

  return (
    <div className="search-results">
      <div className="results__bg" />

      {/* Back nav */}
      <div className="results__nav">
        <button className="results__back" onClick={onBack}>
          ← back to search
        </button>
        <div className="results__wordmark">shelf</div>
      </div>

      {/* Search summary */}
      <div className="results__header">
        <div className="results__mode-badge">
          <span>{MODE_LABELS[mode] || modeLabel}</span>
        </div>
        {query && (
          <div className="results__query">
            <span className="query-quote">"</span>
            {query}
            <span className="query-quote">"</span>
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="results__tags-summary">
            {tags.map(t => (
              <span key={t} className="result-tag">{t.replace(/-/g, " ")}</span>
            ))}
          </div>
        )}
        <div className="results__count">
          {hasResults
            ? `${results.length} book${results.length !== 1 ? "s" : ""} found`
            : "no books found"}
        </div>
      </div>

      {/* Results list */}
      <div className="results__list">
        {hasResults ? (
          results.map((book, i) => (
            <div
              key={book.id}
              className="result-item"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <BookCard
                book={book}
                onSelect={onBookSelect}
                rank={`#${String(i + 1).padStart(2, "0")}`}
              />
            </div>
          ))
        ) : (
          <div className="results__empty">
            <div className="empty__icon">◌</div>
            <p className="empty__title">The shelves are bare</p>
            <p className="empty__body">
              No books matched your search. Try different phrasing, a different mode,
              or broaden your query.
            </p>
            <button className="empty__back" onClick={onBack}>← try another search</button>
          </div>
        )}
      </div>

      {hasResults && (
        <div className="results__footer">
          <button className="results__new-search" onClick={onBack}>
            ← new search
          </button>
          <p className="results__note">
            Results ranked by semantic relevance. Every match shows why it was selected.
          </p>
        </div>
      )}
    </div>
  );
}
