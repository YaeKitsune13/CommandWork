import { useParams, Link } from 'react-router-dom';
import { useAlbum } from '../../shared/hooks/useAlbum';
import TrackCard from '../../shared/components/TrackCard';
import { getImageUrl } from '../../shared/utils/imageUrl';
import './Album.css';

export default function Album() {
  const { id } = useParams();
  const { album, loading, error } = useAlbum(id);

  if (loading) return <p className="album__hint">Загрузка...</p>;
  if (error) return <p className="album__error">{error}</p>;
  if (!album) return null;

  const coverUrl = getImageUrl(album.image);

  const artistLabel = album.artistName ?? `Артист #${album.artistId}`;
  const tracks = (album.tracks ?? []).map((t) => ({
    ...t,
    artistName: t.artistName ?? artistLabel,
  }));

  return (
    <div className="album">
      <Link to="/" className="album__back">На главную</Link>

      <header className="album__header">
        <div className="album__cover">
          {coverUrl ? (
            <img src={coverUrl} alt={album.name} />
          ) : (
            <div className="album__cover-placeholder">♪</div>
          )}
        </div>
        <div className="album__meta">
          <h1>{album.name}</h1>
          <p className="album__artist">{artistLabel}</p>
          {album.releaseDate && (
            <p className="album__date">
              {new Date(album.releaseDate).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      </header>

      <section className="album__tracks">
        <h2>Треки</h2>
        {tracks.length === 0 && <p className="album__hint">В альбоме нет треков</p>}
        {tracks.map((t, i) => (
          <TrackCard key={t.id} track={t} rank={i + 1} />
        ))}
      </section>
    </div>
  );
}