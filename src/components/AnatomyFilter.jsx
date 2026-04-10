import { ANATOMY_LOCATIONS } from "../data/books";
import "./AnatomyFilter.css";

export default function AnatomyFilter({ value, onChange, mode }) {
  // Show relevant locations based on mode
  const relevantIds = {
    fragment: ["not-sure", "opening", "epigraph", "dedication", "body", "acknowledgments", "chapter-header", "authors-note"],
    epilogue: ["not-sure", "epilogue", "body"],
    special: ["not-sure", "dedication", "epigraph", "acknowledgments", "authors-note"],
    image: ["not-sure", "opening", "epigraph", "body", "dedication", "epilogue"],
  };

  const show = relevantIds[mode] || relevantIds.fragment;
  const filtered = ANATOMY_LOCATIONS.filter(l => show.includes(l.id));

  return (
    <div className="anatomy-filter">
      <div className="anatomy-filter__label">
        <span className="anatomy-label__icon">◉</span>
        where in the book?
      </div>
      <div className="anatomy-filter__options">
        {filtered.map(loc => (
          <button
            key={loc.id}
            className={`anatomy-option ${value === loc.id ? "anatomy-option--active" : ""}`}
            onClick={() => onChange(loc.id)}
            title={loc.description}
          >
            <span className="anatomy-option__label">{loc.label}</span>
            <span className="anatomy-option__desc">{loc.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
