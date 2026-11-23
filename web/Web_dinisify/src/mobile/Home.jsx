import { Link, useNavigate } from 'react-router-dom';
// ВАЖНО: проверьте, что файл называется useAuth.js, а не auth.js
import { useAuth } from '../shared/hooks/useAuth';
import { useDiscovery } from '../shared/hooks/useDiscovery';
import TrackCard from '.././shared/components/TrackCard';
import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../shared/components/SearchBar';
import { useAlbums } from '../shared/hooks/useAlbums';
import AlbumCard from './components/AlbumCard';
import { API_URL, request } from '../shared/api/client';
import './Home.css';

export default function Home() {
  const { isGuest, logout, role, token } = useAuth();
  const charts = useDiscovery('charts', { period: 'week', limit: 10 });
  const recs = useDiscovery('recommendations', { limit: 10 });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { albums, loading: albumsLoading, error: albumsError, reload: reloadAlbums } = useAlbums();

  // Плейлисты пользователя (или публичные для гостя)
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState(null);

  // Состояние создания альбома
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [albumImage, setAlbumImage] = useState(null);
  const [albumSaving, setAlbumSaving] = useState(false);
  const [albumError, setAlbumError] = useState('');

  // Состояние создания плейлиста
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistPrivacy, setPlaylistPrivacy] = useState('public');
  const [playlistSaving, setPlaylistSaving] = useState(false);
  const [playlistError, setPlaylistError] = useState('');

  const isStaff = role === 'moderator' || role === 'admin';
  const getAuthToken = () => token || localStorage.getItem('token');

  const loadPlaylists = useCallback(async () => {
    setPlaylistsLoading(true);
    setPlaylistsError(null);
    try {
      const hasToken = Boolean(getAuthToken());
      const endpoint = !isGuest && hasToken
        ? '/playlists/my?page=1&pageSize=20'
        : '/playlists?page=1&pageSize=20';
      const data = await request(endpoint, { auth: !isGuest && hasToken });
      const list = Array.isArray(data) ? data : data?.items;
      setPlaylists(Array.isArray(list) ? list : []);
    } catch (err) {
      setPlaylistsError(err.message || 'Не удалось загрузить плейлисты');
    } finally {
      setPlaylistsLoading(false);
    }
  }, [isGuest, token]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const query = search.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    setAlbumError('');
    if (!albumName.trim()) {
      setAlbumError('Введите название альбома');
      return;
    }

    setAlbumSaving(true);
    try {
      const fd = new FormData();
      fd.append('Name', albumName.trim());
      if (releaseDate) fd.append('ReleaseDate', releaseDate);
      if (albumImage) fd.append('Image', albumImage);

      const headers = {};
      const tk = getAuthToken();
      if (tk) headers['Authorization'] = `Bearer ${tk}`;

      const res = await fetch(`${API_URL}/albums`, {
        method: 'POST',
        headers,
        body: fd,
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Ошибка ${res.status}`);
      }

      setAlbumName('');
      setAlbumImage(null);
      setShowAlbumModal(false);
      if (typeof reloadAlbums === 'function') {
        reloadAlbums();
      }
      alert('Альбом создан');
    } catch (err) {
      setAlbumError(err.message || 'Не удалось создать альбом');
    } finally {
      setAlbumSaving(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    setPlaylistError('');
    if (!playlistName.trim()) {
      setPlaylistError('Введите название плейлиста');
      return;
    }

    setPlaylistSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const tk = getAuthToken();
      if (tk) headers['Authorization'] = `Bearer ${tk}`;

      const isPublic = playlistPrivacy === 'public';
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: playlistName.trim(),
          description: playlistDesc.trim(),
          privacy: playlistPrivacy,
          isPublic,
        }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Ошибка ${res.status}`);
      }

      setPlaylistName('');
      setPlaylistDesc('');
      setPlaylistPrivacy('public');
      setShowPlaylistModal(false);
      await loadPlaylists();
      alert('Плейлист создан');
      if (data?.id) {
        navigate(`/playlists/${data.id}`);
      }
    } catch (err) {
      setPlaylistError(err.message || 'Не удалось создать плейлист');
    } finally {
      setPlaylistSaving(false);
    }
  };

  return (
    <div className="home">
      <header className="home__header">
        <h1>Dinisify</h1>
        <span className="home__role">{isGuest ? 'гость' : 'пользователь'}</span>
      </header>

      <form className="home__search" onSubmit={handleSearchSubmit}>
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={handleSearchSubmit}
          placeholder="Поиск треков, авторов, альбомов..."
        />
        <button type="submit" className="home__search-btn">
          Найти
        </button>
      </form>

      <section className="home__section">
        <h2>Топ недели</h2>
        {charts.loading && <p>Загрузка...</p>}
        {charts.error && <p className="home__error">{charts.error}</p>}
        {!charts.loading && !charts.error && charts.items.length === 0 && (
          <p className="home__empty">Пока нет данных</p>
        )}
        {charts.items.map((t) => (
          <TrackCard key={t.id || t.track?.id} track={t} />
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

      <section className="home__section">
        <h2>{isGuest ? 'Публичные плейлисты' : 'Мои плейлисты'}</h2>
        {playlistsLoading && <p>Загрузка...</p>}
        {playlistsError && <p className="home__error">{playlistsError}</p>}
        {!playlistsLoading && !playlistsError && playlists.length === 0 && (
          <p className="home__empty">Пока нет плейлистов</p>
        )}
        <div className="home__playlist-grid">
          {playlists.map((pl) => (
            <Link key={pl.id} to={`/playlists/${pl.id}`} className="home__playlist-card">
              <strong>{pl.name}</strong>
              {pl.description && <span>{pl.description}</span>}
              <span>
                Треков: {pl.tracksCount ?? pl.tracks?.length ?? 0}
                {pl.myRole && pl.myRole !== 'owner' ? ` · ${pl.myRole}` : ''}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="home__create-actions">
        <Link to="/upload" className="home__upload-link">+ Загрузить трек</Link>
        {!isGuest && (
          <>
            <button
              type="button"
              className="home__upload-link"
              onClick={() => {
                setAlbumError('');
                setShowAlbumModal(true);
              }}
            >
              + Создать альбом
            </button>
            <button
              type="button"
              className="home__upload-link"
              onClick={() => {
                setPlaylistError('');
                setShowPlaylistModal(true);
              }}
            >
              + Создать плейлист
            </button>
          </>
        )}
      </div>

      {showAlbumModal && (
        <div className="home__modal-backdrop" onClick={() => !albumSaving && setShowAlbumModal(false)}>
          <form className="home__modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateAlbum}>
            <h3>Новый альбом</h3>
            <label>
              Название *
              <input
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                required
                maxLength={200}
              />
            </label>
            <label>
              Дата релиза
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </label>
            <label>
              Обложка (необязательно)
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setAlbumImage(e.target.files?.[0] ?? null)}
              />
            </label>
            {albumError && <p className="home__error">{albumError}</p>}
            <div className="home__modal-actions">
              <button type="submit" disabled={albumSaving}>
                {albumSaving ? 'Создание...' : 'Создать'}
              </button>
              <button type="button" disabled={albumSaving} onClick={() => setShowAlbumModal(false)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {showPlaylistModal && (
        <div className="home__modal-backdrop" onClick={() => !playlistSaving && setShowPlaylistModal(false)}>
          <form className="home__modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreatePlaylist}>
            <h3>Новый плейлист</h3>
            <label>
              Название *
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                required
                maxLength={200}
              />
            </label>
            <label>
              Описание
              <textarea
                rows={3}
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
              />
            </label>
            <label>
              Доступ
              <select value={playlistPrivacy} onChange={(e) => setPlaylistPrivacy(e.target.value)}>
                <option value="public">Публичный</option>
                <option value="private">Приватный</option>
              </select>
            </label>
            {playlistError && <p className="home__error">{playlistError}</p>}
            <div className="home__modal-actions">
              <button type="submit" disabled={playlistSaving}>
                {playlistSaving ? 'Создание...' : 'Создать'}
              </button>
              <button type="button" disabled={playlistSaving} onClick={() => setShowPlaylistModal(false)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="home__actions">
        {isStaff && (
          <Link to="/moderation" className="home__upload-link" style={{ background: '#5e35b1' }}>
            Модерация
          </Link>
        )}
        <Link to="/settings" className="home__upload-link" style={{ background: '#455a64' }}>
          Настройки
        </Link>
        <button onClick={logout}>Выйти</button>
      </div>
    </div>
  );
}