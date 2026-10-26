import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../player/PlayerContext';
import './TrackCard.css';

export default function TrackCard({ track, rank }) {
  const navigate = useNavigate();
  const { playTrack, current, isPlaying } = usePlayer();

  const id = track.id ?? track.trackId;
  const name = track.name ?? track.trackName;
  const artist = track.artistName;
  const image = track.image;
  const duration = track.durationSec;
  const listens = track.listensCount;

  const isCurrent = current?.id === id;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrent) playTrack(track); // toggle — если добавите toggle, ещё лучше
    else playTrack(track);
  };

  const handleOpen = () => {
    navigate(`/tracks/${id}`);
  };

  return (
    <div
      className="track-card"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <button className="track-card__play" onClick={handlePlay} aria-label="Play">
        {isCurrent && isPlaying ? '⏸' : '▶'}
      </button>

      <div className="track-card__rank">{rank ?? track.rank ?? ''}</div>

      <div className="track-card__cover">
        {image ? <img src={image} alt={name} /> : <div className="track-card__placeholder">♪</div>}
      </div>

      <div className="track-card__info">
        <div className="track-card__title">{name}</div>
        <div className="track-card__artist">{artist}</div>
      </div>

      <div className="track-card__meta">
        {duration != null && <span>{formatDuration(duration)}</span>}
        {listens != null && <span>{listens} ▶</span>}
      </div>
    </div>
  );
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}