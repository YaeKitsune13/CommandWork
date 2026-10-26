import { usePlayer } from './PlayerContext';
import './PlayerBar.css';

export default function PlayerBar() {
  const { current, isPlaying, currentTime, duration, toggle, seek } = usePlayer();

  if (!current) return null;

  return (
    <div className="player-bar">
      <div className="player-bar__info">
        <div className="player-bar__title">{current.name}</div>
        <div className="player-bar__artist">{current.artistName}</div>
      </div>

      <button className="player-bar__btn" onClick={toggle}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="player-bar__progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}