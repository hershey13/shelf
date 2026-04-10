import "./BookCard.css";

export default function BookCard({ book, onSelect, rank }) {
  const score = book.score ? Math.round(book.score * 100) : null;

  return (
    <div className="book-card" onClick={() => onSelect(book)}>
      <div className="book-card__spine" style={{ background: book.coverColor || "#2c1a08" }} />

      <div className="book-card__cover" style={{ background: book.coverColor || "#2c1a08" }}>
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
          <span className="book-card__author">— {book.author}, {book.year}</span>
        </div>

        <p className="book-card__synopsis">{book.synopsis.slice(0, 140)}…</p>

        <div className="book-card__tags">
          {book.tags.slice(0, 4).map(tag => (
            <span key={tag} className="book-tag">{tag}</span>
          ))}
        </div>

        <div className="book-card__match">
          <span className="match-icon">✦</span>
          <span className="match-reason">{book.matchReason}</span>
          {score && <span className="match-score">{score}% match</span>}
        </div>

        <div className="book-card__opening">
          <span className="opening-label">opens with: </span>
          <em>"{book.opening.slice(0, 80)}…"</em>
        </div>
      </div>

      <div className="book-card__arrow">→</div>
    </div>
  );
}
