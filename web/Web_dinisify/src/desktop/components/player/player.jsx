import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import CometDial from "shared/components/vynill_player/CometDial";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./player.css";

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function Player({ track }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load new track when id changes
  useEffect(() => {
    if (!track?.id || !audioRef.current) return;
    audioRef.current.src = `http://127.0.0.1:5000/api/music/sound?id=${track.id}`;
    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [track?.id]);

  if (!track) return null; // ← the fix

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Support both shapes: API returns { name, author, image }, dummy used { title, artist, cover }
  const title = track.name ?? track.title ?? "Без названия";
  const artist = track.author ?? track.artist ?? "";
  const cover = track.image ?? track.cover ?? null;

  return (
    <div className="player-bar">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="player__art">
        <img src={imageUrl(cover)} onError={onImgError} alt={title} />
      </div>

      <div className="player__info">
        <span className="player__title">{title}</span>
        <span className="player__artist">{artist}</span>
      </div>

      <div className="player__vinyl">
        <div className="player__dial-wrapper">
          <CometDial
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            size={120}
            sweep={320}
            thickness={6}
            accent="#E5383B"
            ink="#7e3f3f"
            label="Громкость"
            unit="%"
          />
        </div>

        <button
          type="button"
          className="player__play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? "Пауза" : "Играть"}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>

      <div className="player__progress-container">
        <span className="player__time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="player__slider"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{ "--progress": `${progressPercent}%` }}
        />
        <span className="player__time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default Player;
