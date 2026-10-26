import { Link } from 'react-router-dom';
import './AlbumCard.css';
import { getImageUrl } from '../../shared/utils/imageUrl';

export default function AlbumCard({ album }) {
  const artistLabel = album.artistName ?? `Артист #${album.artistId}`;
  const coverUrl = getImageUrl(album.image);
  return (
    <Link to={`/albums/${album.id}`} className="album-card">
      <div className="album-card__cover">
        {coverUrl ? <img src={coverUrl} alt={album.name} /> : <div className="album-card__placeholder">.</div>}
      </div>
      <div className="album-card__title">{album.name}</div>
      <div className="album-card__artist">{artistLabel}</div>
    </Link>
  );
}