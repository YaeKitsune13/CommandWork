import { useState } from 'react';
import { Search, Play, Heart, MoreHorizontal } from 'lucide-react';
import './Catalog_window.css';

import mfdoomImg from '/src/assets/images/MFDOOM.jpg';
import madnessImg from '/src/assets/images/nightboattocairo.jpg';
import redFangImg from '/src/assets/images/redfang.jpg';
import saturnsImg from '/src/assets/images/saturns_children.jpg';
import earthWindImg from '/src/assets/images/septembre.jpg';
import tylerImg from '/src/assets/images/tylerthecreator.jpg';

function Catalog_window() {
  const [searchQuery, setSearchQuery] = useState('');

  // =====================================================================
  
  const mockAuthors = [
    { id: 'a1', name: 'MF DOOM', tracks: 12, color: '#E5383B', photo: mfdoomImg },
    { id: 'a2', name: 'MADNESS', tracks: 8, color: '#4A90D9', photo: madnessImg },
    { id: 'a3', name: 'Red Fang', tracks: 21, color: '#F5A623', photo: redFangImg },
    { id: 'a4', name: 'Electric Wizards', tracks: 5, color: '#7B61FF', photo: saturnsImg },
    { id: 'a5', name: 'earth, fire & wind', tracks: 17, color: '#2ECC71', photo: earthWindImg },
    { id: 'a6', name: 'Tyler the Creator', tracks: 9, color: '#E91E63', photo: tylerImg },
  ];

  const mockTracks = [
    {
      id: 't1',
      title: 'rap snitch knishes',
      artist: 'MF DOOM',
      genre: 'Synthwave',
      duration: '3:42',
      image:mfdoomImg
    },
    {
      id: 't2',
      title: 'Prehistoric dogs',
      artist: 'Red Fang',
      genre: 'Electronic',
      duration: '4:18',
      image:redFangImg
    },
    {
      id: 't3',
      title: ' Saturns Children',
      artist: 'Electric Wizards',
      genre: 'Ambient',
      duration: '5:01',
      image:saturnsImg
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
            placeholder="Поиск Песен, Артистов, Плейлистов"
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
             <div className="author-card__image-wrapper">
                <img 
                  src={author.photo} 
                  alt={author.name} 
                  className="author-card__image" 
                />
              </div>
              <span className="author-card__name">{author.name}</span>
              <span className="author-card__count">{author.tracks} Песен</span>
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

              <div className="track-row__cover" >
                <img src={track.image} alt="almub" />
              </div>

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