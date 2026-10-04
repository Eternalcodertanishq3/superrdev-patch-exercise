// Fix (Bug #11 & UX Enhancement): Added aria-label, search icon, shortcut hint, and instant clear button
export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar-wrapper">
      <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        className="search-input"
        placeholder="Search tasks by title, description..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search tasks"
        id="task-search"
      />
      {value ? (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
          title="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ) : (
        <span className="search-shortcut-hint">/</span>
      )}
    </div>
  );
}
