import { useState } from "react";
import SearchBar from "../components/SearchBar";
import AnatomyFilter from "../components/AnatomyFilter";
import MoodBoard from "../components/MoodBoard";
import SearchExamples from "../components/SearchExamples";
import { searchBooks } from "../data/books";
import FragmentInput from '../components/FragmentInput'
import ImageSearch from '../components/ImageSearch'
import ReturnHome from "../components/ReturnHome";
import "./Search.css";

const SEARCH_MODES = [
  {
    id: "fragment",
    icon: "✦",
    label: "Fragment",
    sublabel: "quote or passage",
    description: "Paste a remembered quote, opening line, epigraph, dedication — however approximate.",
    placeholder: "e.g. last night I dreamt I went… or something about grief and lighthouses",
    exampleTag: "I remember a quote",
  },
  {
    id: "vibe",
    icon: "◈",
    label: "Vibe",
    sublabel: "natural language",
    description: "Describe the book you want in plain language — mood, setting, feel.",
    placeholder: "e.g. dark slow-burning gothic set in an all-girls school, or cozy mystery with found family",
    exampleTag: "I know the feeling",
  },
  {
    id: "mood",
    icon: "❧",
    label: "Mood board",
    sublabel: "build a canvas",
    description: "Pick tags in BookTok vocabulary and combine them into a mood canvas.",
    placeholder: null,
    exampleTag: "I know the vibe",
  },
  {
    id: "image",
    icon: "⊕",
    label: "Image",
    sublabel: "screenshot or photo",
    description: "Upload a Kindle screenshot, Instagram quote graphic, or photo of a page.",
    placeholder: null,
    exampleTag: "I have a photo",
  },
  {
    id: "epilogue",
    icon: "∞",
    label: "Epilogue",
    sublabel: "ending / coda",
    description: "Search by the feeling of an ending — 'bittersweet, years later, they stayed together'.",
    placeholder: "e.g. one where you find out they stayed together ten years later…",
    exampleTag: "I remember the ending",
  },
  {
    id: "special",
    icon: "☽",
    label: "Special mentions",
    sublabel: "dedication · epigraph · acknowledgment",
    description: "Search inside the most emotionally loaded text in any book.",
    placeholder: "e.g. for everyone who felt too much — or a remembered dedication",
    exampleTag: "I remember the dedication",
  },
];

export default function Search({ onSearch, onBookSelect, onBackHome }) {
  const [activeMode, setActiveMode] = useState("fragment");
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [anatomy, setAnatomy] = useState("not-sure");
  const [imageFile, setImageFile] = useState(null);
  const [imageText, setImageText] = useState("");
  const [imageStep, setImageStep] = useState("upload"); // upload | confirm
  const [isSearching, setIsSearching] = useState(false);

  const currentMode = SEARCH_MODES.find(m => m.id === activeMode);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    // Simulate OCR
    setImageText("Last night I dreamt I went to Manderley again. It seemed to me I stood by the iron gate leading to the drive, and for a while I could not enter, for the way was barred to me.");
    setImageStep("confirm");
  };

 // ✅ REPLACE WITH — just pass params, SearchResults fetches via useBookSearch
const handleSearch = () => {
  const searchQuery = activeMode === "image" ? imageText : query;
  const modeMap = { epilogue: "epilogue", special: "special_mentions" };
  const mappedMode = modeMap[activeMode] || activeMode;

  onSearch({
    query: searchQuery,
    mode: mappedMode,
    tags: selectedTags,
    anatomy,
    modeLabel: currentMode.label,
  });
};
  const canSearch =
    (activeMode === "mood" && selectedTags.length > 0) ||
    (activeMode === "image" && imageStep === "confirm" && imageText) ||
    (activeMode !== "mood" && activeMode !== "image" && query.trim().length > 0);

  return (
    <div className="search-hub">
      {/* Ambient bg */}
      <div className="hub__bg" />
     <ReturnHome onClick={onBackHome} variant="corner" />
 

      {/* Header */}
      <header className="hub__header">
        <div className="hub__wordmark">shelf</div>
        <p className="hub__tagline">find the book you're thinking of</p>
      </header>

      {/* Mode selector */}
      <div className="hub__modes">
        <div className="modes__label">how do you remember it?</div>
        <div className="modes__grid">
          {SEARCH_MODES.map(mode => (
            <button
              key={mode.id}
              className={`mode-pill ${activeMode === mode.id ? "mode-pill--active" : ""}`}
              onClick={() => {
                setActiveMode(mode.id);
                setQuery("");
                setSelectedTags([]);
                setImageFile(null);
                setImageStep("upload");
              }}
            >
              <span className="mode-pill__icon">{mode.icon}</span>
              <span className="mode-pill__label">{mode.label}</span>
              <span className="mode-pill__sub">{mode.sublabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search area */}
      <div className="hub__search-area">
        <div className="search-area__description">
          {currentMode.description}
        </div>

        {/* Fragment / Vibe / Epilogue / Special */}
        {["fragment", "vibe", "epilogue", "special"].includes(activeMode) && (
          <div className="search-area__input-block">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={currentMode.placeholder}
              onSearch={handleSearch}
              mode={activeMode}
            />
            {(activeMode === "fragment" || activeMode === "epilogue" || activeMode === "special") && (
              <AnatomyFilter
                value={anatomy}
                onChange={setAnatomy}
                mode={activeMode}
              />
            )}
            <SearchExamples mode={activeMode} onSelect={setQuery} />
          </div>
        )}

        {/* Mood board */}
        {activeMode === "mood" && (
          <div className="search-area__input-block">
            <MoodBoard selectedTags={selectedTags} onToggle={handleTagToggle} />
            {selectedTags.length > 0 && (
              <div className="selected-tags-preview">
                <span className="preview-label">your canvas:</span>
                {selectedTags.map(t => (
                  <span key={t} className="preview-tag">{t.replace(/-/g, " ")}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Image search */}
        {/* Image search */}
{activeMode === "image" && (
  <div className="search-area__input-block">
    <ImageSearch
      onSearch={(data) => {
        onSearch({
          query: data.query,
          mode: 'image',
          tags: [],
          anatomy: data.anatomy,
          modeLabel: 'Image',
        })
      }}
    />
  </div>
)}
        {/* {activeMode === "image" && (
          <div className="search-area__input-block">
            {imageStep === "upload" && (
              <div className="image-upload">
                <label className="image-upload__zone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="visually-hidden"
                  />
                  <div className="upload-zone__inner">
                    <div className="upload-zone__icon">⊕</div>
                    <p className="upload-zone__title">Drop your image here</p>
                    <p className="upload-zone__sub">Kindle screenshot · Instagram quote · photo of a page · book cover</p>
                    <span className="upload-zone__btn">Choose file</span>
                  </div>
                </label>
              </div>
            )}
            {imageStep === "confirm" && (
              <div className="image-confirm">
                <div className="image-confirm__label">
                  <span className="confirm-icon">✓</span> Extracted text — correct any errors before searching:
                </div>
                <textarea
                  className="image-confirm__text"
                  value={imageText}
                  onChange={e => setImageText(e.target.value)}
                  rows={4}
                />
                <button className="image-confirm__reset" onClick={() => { setImageFile(null); setImageStep("upload"); }}>
                  ← upload different image
                </button>
                <AnatomyFilter value={anatomy} onChange={setAnatomy} mode={activeMode} />
              </div>
            )}
          </div>
        )} */}

        {/* Search button */}
        {activeMode !== "mood" && (
          <button
            className={`hub__search-btn ${canSearch ? "hub__search-btn--active" : ""}`}
            onClick={handleSearch}
            disabled={!canSearch || isSearching}
          >
            {isSearching ? (
              <span className="searching-text">searching the shelves<span className="dots">...</span></span>
            ) : (
              <span>search the library →</span>
            )}
          </button>
        )}

        {activeMode === "mood" && selectedTags.length > 0 && (
          <button
            className="hub__search-btn hub__search-btn--active"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="searching-text">searching the shelves<span className="dots">...</span></span>
            ) : (
              <span>find books with this mood →</span>
            )}
          </button>
        )}

        
      </div>

      {/* Decorative footer rule */}
      <div className="hub__divider">
        <span>◆ ◆ ◆</span>
      </div>
    </div>
  );
}
