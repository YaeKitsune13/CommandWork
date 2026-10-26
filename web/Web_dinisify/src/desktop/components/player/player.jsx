import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import CometDial from '../../../shared/components/vynill_player/CometDial'; 
import './player.css';

function Player({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  return (
    <div className="player-bar">
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
            onChange={(v) => setVolume(v)}
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
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Пауза' : 'Играть'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
    </div>
  );
}

export default Player;