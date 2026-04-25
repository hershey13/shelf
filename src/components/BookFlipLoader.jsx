// src/components/BookFlipLoader.jsx
// Drop-in loading screen — import and render when isLoading === true

import './BookFlipLoader.css'

const LOADING_LINES = [
  "searching the shelves…",
  "turning pages…",
  "reading between the lines…",
  "finding your book…",
  "combing through epigraphs…",
]

export default function BookFlipLoader({ message }) {
  const line = message || LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]

  return (
    <div className="bfl__overlay" aria-live="polite" aria-label="Loading">
      <div className="bfl__wrap">

        {/* ── The Book ─────────────────────────────────────── */}
        <div className="bfl__book" aria-hidden="true">

          {/* spine */}
          <div className="bfl__spine" />

          {/* back cover (static) */}
          <div className="bfl__cover bfl__cover--back" />

          {/* pages stack */}
          <div className="bfl__pages">
            <div className="bfl__page bfl__page--1" />
            <div className="bfl__page bfl__page--2" />
            <div className="bfl__page bfl__page--3" />
            <div className="bfl__page bfl__page--4" />
            <div className="bfl__page bfl__page--5" />
          </div>

          {/* front cover (flips) */}
          <div className="bfl__cover bfl__cover--front">
            {/* decorative lines on cover */}
            <div className="bfl__cover-deco">
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* ── Label ────────────────────────────────────────── */}
        <p className="bfl__label">{line}</p>

        {/* ── Dot pulse ────────────────────────────────────── */}
        <div className="bfl__dots" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
