import { Link } from 'react-router-dom';
import './AlbumCard.css';

export default function AlbumCard({ album }) {
  const artistLabel = album.artistName ?? `Артист #${album.artistId}`;

  return (
    <Link to={`/albums/${album.id}`} className="album-card">
      <div className="album-card__cover">
        {album.image ? (
          <img src={album.image} alt={album.name} />
        ) : (
          <div className="album-card__placeholder">♪</div>
        )}
      </div>
      <div className="album-card__title">{album.name}</div>
      <div className="album-card__artist">{artistLabel}</div>
    </Link>
  );
}