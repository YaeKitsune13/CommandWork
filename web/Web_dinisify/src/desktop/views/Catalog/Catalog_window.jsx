import { useState } from 'react';
import { Search, Play, Heart, MoreHorizontal } from 'lucide-react';
import './Catalog_window.css';

function Catalog_window() {
  const [searchQuery, setSearchQuery] = useState('');

  // =====================================================================
  const mockAuthors = [
    { id: 'a1', name: 'Nova Drift', tracks: 12, color: '#E5383B' },
    { id: 'a2', name: 'Lumen', tracks: 8, color: '#4A90D9' },
    { id: 'a3', name: 'Kairo', tracks: 21, color: '#F5A623' },
    { id: 'a4', name: 'Mellow Vibe', tracks: 5, color: '#7B61FF' },
    { id: 'a5', name: 'Static Bloom', tracks: 17, color: '#2ECC71' },
    { id: 'a6', name: 'Glass Echo', tracks: 9, color: '#E91E63' },
  ];

  const mockTracks = [
    {
      id: 't1',
      title: 'Midnight Drive',
      artist: 'Nova Drift',
      genre: 'Synthwave',
      duration: '3:42',
    },
    {
      id: 't2',
      title: 'Neon Rain',
      artist: 'Lumen',
      genre: 'Electronic',
      duration: '4:18',
    },
    {
      id: 't3',
      title: 'Glass Echoes',
      artist: 'Glass Echo',
      genre: 'Ambient',
      duration: '5:01',
    },
  ];
  // =====================================================================

  return (
    <div className="catalog">
      
      <div className="catalog__search-container">
        <div className="catalog__search-wrapper">
          <Search size={18} className="catalog__search-icon" />
          <input
            type="text"
            className="catalog__search-input"
            placeholder="Search tracks, artists, playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="button" className="catalog__search-btn">
          Search
        </button>
      </div>

      <hr className="catalog__divider" />

      <section className="catalog__section">
        <div className="catalog__authors">
          {mockAuthors.map((author) => (
            <button key={author.id} type="button" className="author-card">
              <div
                className="author-card__avatar"
                style={{ background: author.color }}
              >
                {author.name.charAt(0)}
              </div>
              <span className="author-card__name">{author.name}</span>
              <span className="author-card__count">{author.tracks} tracks</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="catalog__divider" />

      <section className="catalog__section">
        <ul className="catalog__tracks">
          {mockTracks.map((track) => (
            <li key={track.id} className="track-row">
              <button type="button" className="track-row__play" aria-label="Play">
                <Play size={18} />
              </button>

              <div className="track-row__cover" />

              <div className="track-row__info">
                <span className="track-row__title">{track.title}</span>
                <span className="track-row__artist">{track.artist}</span>
              </div>

              <span className="track-row__genre">{track.genre}</span>
              <span className="track-row__duration">{track.duration}</span>

              <button type="button" className="track-row__action" aria-label="Like">
                <Heart size={16} />
              </button>
              <button type="button" className="track-row__action" aria-label="More">
                <MoreHorizontal size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

export default Catalog_window;