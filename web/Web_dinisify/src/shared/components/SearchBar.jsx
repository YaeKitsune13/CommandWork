import './SearchBar.css';

export default function SearchBar({ value, onChange, placeholder = 'Поиск треков, артистов, альбомов' }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}