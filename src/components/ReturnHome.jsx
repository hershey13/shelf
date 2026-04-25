import './ReturnHome.css'

export default function ReturnHome({ onClick, variant = 'corner', label = '← Return Home' }) {
  return (
    <button
      type="button"
      className={`rh-btn rh-btn--${variant}`}
      onClick={onClick}
      aria-label="Return to home page"
    >
      <span className="rh-btn__arrow">←</span>
      <span className="rh-btn__text">Return Home</span>
    </button>
  )
}
