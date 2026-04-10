import { MOOD_TAGS } from "../data/books";
import "./MoodBoard.css";

const CATEGORIES = {
  "Character": ["morally-grey", "unreliable-narrator"],
  "Romance": ["enemies-to-lovers", "slow-burn", "forbidden-love"],
  "Atmosphere": ["dark-academia", "gothic", "dreamlike", "cozy"],
  "Feeling": ["devastating", "bittersweet", "lyrical", "trauma"],
  "Setting": ["college-setting", "set-in-ireland", "historical", "1990s"],
  "Form": ["epistolary", "magic-realism", "psychological", "debut-novel"],
  "Community": ["found-family"],
};

export default function MoodBoard({ selectedTags, onToggle }) {
  return (
    <div className="moodboard">
      <div className="moodboard__header">
        <p className="moodboard__intro">
          Build your mood canvas — combine tags to find books that match exactly how you feel.
        </p>
      </div>

      {Object.entries(CATEGORIES).map(([category, tagIds]) => (
        <div key={category} className="moodboard__category">
          <div className="category__label">{category}</div>
          <div className="category__tags">
            {tagIds.map(id => {
              const tag = MOOD_TAGS.find(t => t.id === id);
              if (!tag) return null;
              const active = selectedTags.includes(id);
              return (
                <button
                  key={id}
                  className={`mood-tag ${active ? "mood-tag--active" : ""}`}
                  onClick={() => onToggle(id)}
                >
                  <span className="mood-tag__emoji">{tag.emoji}</span>
                  <span className="mood-tag__label">{tag.label}</span>
                  {active && <span className="mood-tag__check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
