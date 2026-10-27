import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import CometDial from '../../../shared/components/vynill_player/CometDial'; 
import './player.css';

// Helper to format seconds into M:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function Player({ track }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume / 100; 
  };

  useEffect(() => {
    if (track && track.audioUrl) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [track]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-bar">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="player__art">
        <img src={track.cover} alt={track.title} />
      </div>

      <div className="player__info">
        <span className="player__title">{track.title}</span>
        <span className="player__artist">{track.artist}</span>
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
          aria-label={isPlaying ? 'Пауза' : 'Играть'}
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
          style={{ '--progress': `${progressPercent}%` }}
        />
        
        <span className="player__time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default Player;