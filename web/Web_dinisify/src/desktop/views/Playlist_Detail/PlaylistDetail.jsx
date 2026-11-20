import { useEffect, useState } from "react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";

const listFrom = (result) => {
  if (Array.isArray(result)) return result;

  for (const key of ["items", "data", "tracks", "music", "results"]) {
    if (Array.isArray(result?.[key])) return result[key];
  }

  return [];
};

const getTrackId = (track) =>
  track?.id ?? track?.trackId ?? track?.track_id ?? track?.music_id;

const getPlaylistTracks = (playlist) =>
  listFrom(playlist?.tracks ?? playlist?.items);

export default function PlaylistDetail_window({
  playlistId,
  onBack,
  onPlayTrack,
}) {
  const [playlist, setPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTrackId, setBusyTrackId] = useState(null);

  useEffect(() => {
    if (!playlistId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [playlistResult, catalogResult] = await Promise.all([
          api.get(`/playlists/${playlistId}`),
          api.get("/tracks", { auth: false }),
        ]);

        if (cancelled) return;

        setPlaylist(playlistResult);
        setPlaylistTracks(getPlaylistTracks(playlistResult));
        setCatalogTracks(listFrom(catalogResult));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Не удалось загрузить плейлист");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  const reloadPlaylist = async () => {
    const result = await api.get(`/playlists/${playlistId}`);
    setPlaylist(result);
    setPlaylistTracks(getPlaylistTracks(result));
  };

  const addTrack = async (track) => {
    const id = getTrackId(track);
    if (id == null) return;

    setBusyTrackId(id);
    setError("");

    try {
      await api.post(`/playlists/${playlistId}/tracks`, {
        trackId: id,
        position: null,
      });
      await reloadPlaylist();
    } catch (err) {
      setError(err.message || "Не удалось добавить трек");
    } finally {
      setBusyTrackId(null);
    }
  };

  const removeTrack = async (track) => {
    const id = getTrackId(track);
    if (id == null) return;

    setBusyTrackId(id);
    setError("");

    try {
      await api.delete(`/playlists/${playlistId}/tracks/${id}`);
      await reloadPlaylist();
    } catch (err) {
      setError(err.message || "Не удалось удалить трек");
    } finally {
      setBusyTrackId(null);
    }
  };

  if (loading) return <p>Загрузка плейлиста...</p>;
  if (error && !playlist) return <p role="alert">{error}</p>;
  if (!playlist) return <p>Плейлист не найден.</p>;

  const playlistTrackIds = new Set(
    playlistTracks.map((item) => getTrackId(item.track ?? item)),
  );

  return (
    <section className="playlist-detail">
      <button type="button" onClick={onBack}>
        Назад
      </button>

      <header className="playlist-detail__header">
        <img
          src={imageUrl(playlist.image)}
          onError={onImgError}
          alt=""
          className="playlist-detail__cover"
        />
        <div>
          <h1>{playlist.name}</h1>
          {playlist.description && <p>{playlist.description}</p>}
        </div>
      </header>

      {error && <p role="alert">{error}</p>}

      <h2>Треки в плейлисте</h2>
      {playlistTracks.map((item) => {
        const track = item.track ?? item;
        const id = getTrackId(track);

        return (
          <div key={id} className="playlist-track">
            <span>{track.name ?? track.title ?? "Без названия"}</span>
            <button type="button" onClick={() => onPlayTrack?.(track)}>
              Воспроизвести
            </button>
            <button
              type="button"
              disabled={busyTrackId === id}
              onClick={() => removeTrack(track)}
            >
              Удалить
            </button>
          </div>
        );
      })}

      <h2>Добавить треки из каталога</h2>
      {catalogTracks.map((track) => {
        const id = getTrackId(track);
        const alreadyAdded = playlistTrackIds.has(id);

        return (
          <div key={id} className="playlist-track">
            <span>{track.name ?? track.title ?? "Без названия"}</span>
            <button
              type="button"
              disabled={id == null || alreadyAdded || busyTrackId === id}
              onClick={() => addTrack(track)}
            >
              {alreadyAdded ? "Уже добавлен" : "Добавить"}
            </button>
          </div>
        );
      })}
    </section>
  );
}
