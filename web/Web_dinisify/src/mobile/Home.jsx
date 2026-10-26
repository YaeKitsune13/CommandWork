import { Link } from 'react-router-dom';
import { useAuth } from '../shared/hooks/auth';
import { useDiscovery } from '../shared/hooks/useDiscovery';
import TrackCard from '.././shared/components/TrackCard';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../shared/components/SearchBar';
import { useAlbums } from '../shared/hooks/useAlbums';
import AlbumCard from './components/AlbumCard';
import './Home.css';

export default function Home() {
  const { isGuest, logout } = useAuth();
  const charts = useDiscovery('charts', { period: 'week', limit: 10 });
  const recs = useDiscovery('recommendations', { limit: 10 });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { albums, loading: albumsLoading, error: albumsError } = useAlbums();
  const { role } = useAuth();
  const isStaff = role === 'moderator' || role === 'admin';
  const handleSearchChange = (value) => {
  setSearch(value);
  if (value.trim()) navigate(`/search?q=${encodeURIComponent(value)}`);
  };
  return (
    <div className="home">
      <header className="home__header">
        <h1>Dinisify</h1>
        <span className="home__role">{isGuest ? 'гость' : 'пользователь'}</span>
      </header>
      <SearchBar value={search} onChange={handleSearchChange} />
      <section className="home__section">
        <h2>Топ недели</h2>
        {charts.loading && <p>Загрузка...</p>}
        {charts.error && <p className="home__error">{charts.error}</p>}
        {!charts.loading && !charts.error && charts.items.length === 0 && (
          <p className="home__empty">Пока нет данных</p>
        )}
        {charts.items.map((t) => (
          <TrackCard key={t.trackId} track={t} />
        ))}
      </section>

      <section className="home__section">
        <h2>Рекомендации</h2>
        {recs.loading && <p>Загрузка...</p>}
        {recs.error && <p className="home__error">{recs.error}</p>}
        {!recs.loading && !recs.error && recs.items.length === 0 && (
          <p className="home__empty">Пока нет данных</p>
        )}
        {recs.items.map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </section>
      <section className="home__section">
        <h2>Альбомы</h2>
        {albumsLoading && <p>Загрузка...</p>}
        {albumsError && <p className="home__error">{albumsError}</p>}
        {!albumsLoading && !albumsError && albums.length === 0 && (
            <p className="home__empty">Пока нет альбомов</p>
        )}
        <div className="home__album-grid">
            {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
            ))}
        </div>
        </section>
      <Link to="/upload" className="home__upload-link">+ Загрузить трек</Link>
        {isStaff && (
        <Link to="/moderation" style={{ marginRight: '12px', color: '#1976d2' }}>
            Панель модератора
        </Link>
        )}
      <div className="home__actions">
            {isStaff && (
            <Link to="/moderation" className="home__upload-link" style={{ background: '#5e35b1' }}>
            Модерация
            </Link>
            )}
        <button onClick={logout}>Выйти</button>
      </div>
    </div>
  );
}