import { useState, useEffect } from "react";
import "./Home.css";


export default function Home({ onEnter }) {
  const [flipped, setFlipped] = useState(false);
  const [entered, setEntered] = useState(false);
  const [candleFlicker, setCandleFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandleFlicker((f) => !f);
    }, 2000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFlip = () => {
    setFlipped(true);
  };

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => onEnter(), 800);
  };

  return (
    <div className={`home ${entered ? "home--exit" : ""}`}>
      {/* Ambient particles */}
      <div className="particles">
        {[...Array(18)].map((_, i) => (
          <div key={i} className={`particle particle--${i}`} />
        ))}
      </div>

      {/* Candle glow */}
      <div className={`candle-glow ${candleFlicker ? "candle-glow--flicker" : ""}`} />

      {/* Header ornament */}
      <div className="home__header">
        <span className="ornament">⸻</span>
        <span className="home__wordmark">shelf</span>
        <span className="ornament">⸻</span>
      </div>

      {/* Book Scene */}
      <div className="book-scene">
        <div className={`book ${flipped ? "book--flipped" : ""}`} onClick={!flipped ? handleFlip : undefined}>
          {/* Book spine shadow */}
          <div className="book__shadow" />

          {/* Front cover */}
          <div className="book__cover book__cover--front">
            <div className="cover__texture" />
            <div className="cover__border" />
            <div className="cover__content">
              <div className="cover__top-ornament">✦ ✦ ✦</div>
              <div className="cover__emblem">
  <svg viewBox="0 0 100 100" className="emblem-svg" aria-hidden="true">
    <circle
      cx="50"
      cy="50"
      r="38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.35"
    />
    <circle
      cx="50"
      cy="50"
      r="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      opacity="0.22"
    />

    <path
      d="M61 20
         C47 22, 36 34, 36 49
         C36 65, 48 78, 64 80
         C55 75, 49 64, 49 52
         C49 39, 54 28, 61 20 Z"
      fill="currentColor"
      opacity="0.88"
    />

    <circle cx="67" cy="33" r="1.8" fill="currentColor" opacity="0.9" />
    <circle cx="73" cy="40" r="1.2" fill="currentColor" opacity="0.7" />
    <circle cx="28" cy="36" r="1.3" fill="currentColor" opacity="0.6" />
    <circle cx="31" cy="66" r="1.5" fill="currentColor" opacity="0.7" />
    <circle cx="72" cy="67" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
</div>
              <h1 className="cover__title">Find the book<br />you half-remember</h1>
              <div className="cover__rule">
                <span>◆</span>
              </div>
              <p className="cover__subtitle">a discovery engine<br />for readers</p>
              <div className="cover__click-hint">
                <span className="hint-text">open the book</span>
                <span className="hint-arrow">↓</span>
              </div>
            </div>
            <div className="cover__bottom-ornament">— shelf · mmxxvi —</div>
          </div>

          {/* Back of front cover / first page */}
          <div className="book__page book__page--left">
            <div className="page__content">
              <p className="page__epigraph">
                "A reader lives a thousand lives before he dies.<br />
                The man who never reads lives only one."
              </p>
              <p className="page__epigraph-attr">— George R.R. Martin</p>
              <div className="page__rule" />
              <p className="page__intro">
                You remember a feeling. A fragment.<br />
                A line that stayed with you.<br />
                <em>shelf</em> finds the book.
              </p>
            </div>
          </div>

          {/* Right page — the 'hop in' page */}
          <div className="book__page book__page--right">
            <div className="page__content page__content--right">
              <div className="page__number">i</div>
              <div className="page__ornament">✦</div>
              <h2 className="page__heading">Begin your search</h2>
              <p className="page__body">
                Search by a remembered quote,<br />
                a feeling, a vibe, an image saved —<br />
                find the book you cannot name.
              </p>
              <div className="page__features">
                <span>Fragment search</span>
                <span>·</span>
                <span>Vibe search</span>
                <span>·</span>
                <span>Image search</span>
                <span>·</span>
                <span>Mood board</span>
              </div>
              <button className="hop-in-btn" onClick={handleEnter}>
                <span className="hop-in-btn__text">Hop in</span>
                <span className="hop-in-btn__arrow">→</span>
              </button>
              <div className="page__footer-rule">
                <span>◆ ◆ ◆</span>
              </div>
            </div>
          </div>

          {/* Page turning pages (decorative layers) */}
          <div className="book__pages-stack">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`page-layer page-layer--${i}`} />
            ))}
          </div>
        </div>

        {!flipped && (
          <div className="flip-instruction">
            <span>click to open</span>
          </div>
        )}
      </div>

      {/* Bottom tagline
      <div className="home__footer">
        <p className="home__tagline">
          <em>not by title or author, but by feeling, fragment, image, or memory</em>
        </p>
      </div> */}
    </div>
  );
}
