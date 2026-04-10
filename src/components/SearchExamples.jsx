import "./SearchExamples.css";

const EXAMPLES = {
  fragment: [
    "last night I dreamt I went to Manderley again",
    "for everyone who felt too much",
    "the snow in the mountains was melting and Bunny had been dead",
    "may in Ayemenem is a hot brooding month",
  ],
  vibe: [
    "dark slow-burning gothic all-girls school",
    "cozy mystery with found family",
    "quiet devastating unreliable British narrator",
    "lyrical forbidden love historical India",
  ],
  epilogue: [
    "bittersweet, they stayed together years later",
    "open ending, you don't know if they made it",
    "time jump, she became who she always wanted to be",
    "tragic, he never found out she loved him",
  ],
  special: [
    "for everyone who felt too much",
    "to the ones who stayed",
    "something about grief and lighthouses",
    "in memoriam, for those who didn't make it",
  ],
};

export default function SearchExamples({ mode, onSelect }) {
  const examples = EXAMPLES[mode];
  if (!examples) return null;

  return (
    <div className="search-examples">
      <div className="examples__label">try one of these:</div>
      <div className="examples__list">
        {examples.map((ex, i) => (
          <button
            key={i}
            className="example-pill"
            onClick={() => onSelect(ex)}
          >
            <span className="example-pill__quote">"</span>
            {ex}
            <span className="example-pill__quote">"</span>
          </button>
        ))}
      </div>
    </div>
  );
}
