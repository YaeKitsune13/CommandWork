import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_URL } from '../api/client';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null); // { id, name, artistName, image }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    const onErr = () => {
      setError('Не удалось загрузить трек');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
    };
  }, []);

  const playTrack = useCallback(async (track) => {
    const id = track.id ?? track.trackId;
    if (id == null) return;

    const audio = audioRef.current;
    if (!audio) return;

    setCurrent({
      id,
      name: track.name ?? track.trackName,
      artistName: track.artistName,
      image: track.image,
    });
    setError(null);
    setCurrentTime(0);
    setDuration(0);

    audio.src = `${API_URL}/api/music/sound?id=${id}`;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        /* ignore */
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    setIsPlaying(false);
    setCurrent(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const value = {
    current,
    isPlaying,
    currentTime,
    duration,
    error,
    playTrack,
    toggle,
    seek,
    stop,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}