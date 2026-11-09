import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import CometDial from "shared/components/vynill_player/CometDial";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./player.css";

import scratchSfx from "../../../assets/scratch.m4a";

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function Player({ track }) {
  const audioRef = useRef(null);
  const scratchRef = useRef(null);
  const moveTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (!track?.streamUrl || !audioRef.current) return;
    audioRef.current.src = `http://127.0.0.1:5000${track.streamUrl}`;
    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [track?.id, track?.streamUrl]);

  if (!track) return null;

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const scheduleScratchMute = () => {
    clearTimeout(moveTimeoutRef.current);
    moveTimeoutRef.current = setTimeout(() => {
      if (scratchRef.current) {
        scratchRef.current.volume = 0;
      }
    }, 100);
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
    if (audioRef.current) audioRef.current.volume = 0;

    if (scratchRef.current) {
      if (scratchRef.current.paused) {
        scratchRef.current.currentTime = 0;
        scratchRef.current.play().catch(() => {});
      }
      scratchRef.current.loop = true;
      scratchRef.current.volume = 0.2;
    }
    scheduleScratchMute();
  };

  const handleScrubChange = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);

    if (scratchRef.current) {
      scratchRef.current.volume = 0.2;
      scheduleScratchMute();
    }
  };

  const handleScrubEnd = () => {
    setIsScrubbing(false);

    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.volume = volume / 100;
    }

    if (scratchRef.current) {
      scratchRef.current.pause();
      scratchRef.current.loop = false;
      scratchRef.current.currentTime = 0;
    }
    clearTimeout(moveTimeoutRef.current);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current && !isScrubbing) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-bar">
      <audio ref={scratchRef} src={scratchSfx} preload="auto" />

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          if (!isScrubbing) setCurrentTime(e.target.currentTime);
        }}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="player__left">
        <div className="player__art">
          <img
            src={imageUrl(track.image)}
            onError={onImgError}
            alt={track.name}
          />
        </div>
        <div className="player__info">
          <span className="player__title">{track.name}</span>
          <span className="player__artist">
            {track.owner?.nickname || "Неизвестный"}
          </span>
        </div>
      </div>

      <div className="player__progress-container">
        <span className="player__time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="player__slider"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleScrubChange}
          onPointerDown={handleScrubStart}
          onPointerUp={handleScrubEnd}
          onPointerLeave={handleScrubEnd}
          style={{ "--progress": `${progressPercent}%` }}
        />
        <span className="player__time">{formatTime(duration)}</span>
      </div>

      <div className="player__right">
        <div className="player__vinyl-wrapper">
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
            label=""
            unit="%"
          />
          <button
            type="button"
            className="player__play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? "Пауза" : "Играть"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Player;
