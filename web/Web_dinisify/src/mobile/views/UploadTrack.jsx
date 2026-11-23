import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUploadTrack } from '../../shared/hooks/useUploadTrack';
import { useAuth } from '../../shared/hooks/useAuth';
import { request } from '../../shared/api/client';
import './UploadTrack.css';

export default function UploadTrack() {
  const navigate = useNavigate();
  const { user, userId: authUserId } = useAuth();
  const { upload, progress, loading, error } = useUploadTrack();

  const [name, setName] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);

  const [playlistId, setPlaylistId] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  const [audioFile, setAudioFile] = useState(null);
  const [image, setImage] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUserOptions() {
      setAlbumsLoading(true);
      setPlaylistsLoading(true);

      try {
        let currentUserId = authUserId ?? user?.id;
        if (!currentUserId) {
          const me = await request('/auth/me').catch(() => null);
          currentUserId = me?.id ?? null;
        }

        const [albumsRes, playlistsRes] = await Promise.allSettled([
          currentUserId
            ? request(`/users/${currentUserId}/albums?page=1&pageSize=100`)
            : Promise.resolve({ items: [] }),
          request('/playlists/my?page=1&pageSize=100'),
        ]);

        if (!active) return;

        setAlbums(
          albumsRes.status === 'fulfilled' && Array.isArray(albumsRes.value?.items)
            ? albumsRes.value.items
            : []
        );
        setPlaylists(
          playlistsRes.status === 'fulfilled' && Array.isArray(playlistsRes.value?.items)
            ? playlistsRes.value.items
            : []
        );
      } finally {
        if (active) {
          setAlbumsLoading(false);
          setPlaylistsLoading(false);
        }
      }
    }

    loadUserOptions();
    return () => {
      active = false;
    };
  }, [authUserId, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!audioFile) {
      alert('Выберите аудиофайл');
      return;
    }

    const res = await upload({ audioFile, name, albumId, image });
    if (res?.success) {
      const createdTrackId = res.track?.id;

      if (playlistId && createdTrackId) {
        try {
          await request(`/playlists/${playlistId}/tracks`, {
            method: 'POST',
            body: { trackId: createdTrackId, position: null },
          });
        } catch (err) {
          alert(`Трек загружен, но не удалось добавить в плейлист: ${err.message}`);
        }
      }

      alert('Трек отправлен на модерацию');
      if (createdTrackId) {
        navigate(`/tracks/${createdTrackId}`);
      } else {
        navigate('/home');
      }
    } else if (res?.error) {
      setSubmitError(res.error);
    }
  };

  const displayError = submitError || error;

  return (
    <form className="upload" onSubmit={handleSubmit}>
      <h1>Загрузить трек</h1>
      <Link to="/home">(-- Назад к поиску</Link>

      <label className="upload__field">
        <span>Название *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </label>

      <label className="upload__field">
        <span>Аудиофайл (mp3 / wav / ogg / flac) *</span>
        <input
          type="file"
          accept=".mp3,.wav,.ogg,.flac"
          onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          required
        />
      </label>

      <label className="upload__field">
        <span>Обложка (jpg / png / webp, необязательно)</span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="upload__row">
        <label className="upload__field">
          <span>Альбом (необязательно)</span>
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            disabled={albumsLoading || loading}
          >
            <option value="">
              {albumsLoading ? 'Загрузка альбомов...' : '— Без альбома —'}
            </option>
            {albums.map((alb) => (
              <option key={alb.id} value={alb.id}>
                {alb.name}
              </option>
            ))}
          </select>
        </label>

        <label className="upload__field">
          <span>Плейлист (необязательно)</span>
          <select
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            disabled={playlistsLoading || loading}
          >
            <option value="">
              {playlistsLoading ? 'Загрузка плейлистов...' : '— Не добавлять в плейлист —'}
            </option>
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name} {pl.myRole && pl.myRole !== 'owner' ? `(${pl.myRole})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="upload__progress">
          <div className="upload__progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}

      {displayError && <p className="upload__error">{displayError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </form>
  );
}