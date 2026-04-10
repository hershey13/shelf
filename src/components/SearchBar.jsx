import "./SearchBar.css";

export default function SearchBar({ value, onChange, placeholder, onSearch, mode }) {
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="searchbar">
      <div className="searchbar__mode-dot" data-mode={mode} />
      <textarea
        className="searchbar__input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={3}
        autoFocus
      />
      <div className="searchbar__hint">press enter to search · or click the button below</div>
    </div>
  );
}
