import { useEffect, useState } from "react";
import { Search, Play, Heart, MoreHorizontal } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./Catalog_window.css";

function extractList(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;

  for (const key of ["items", "data", "tracks", "music", "results", "likes"]) {
    if (Array.isArray(result[key])) return result[key];
  }

  return [];
}

function readLikeCount(result) {
  if (typeof result === "number") return result;

  for (const key of ["count", "likeCount", "likesCount", "total"]) {
    if (typeof result?.[key] === "number") return result[key];
  }

  if (Array.isArray(result)) return result.length;

  for (const key of ["items", "data", "likes", "results"]) {
    if (Array.isArray(result?.[key])) return result[key].length;
  }

  return null;
}

function toTrack(item) {
  const src = item?.track ?? item ?? {};

  return {
    id: src.id ?? src.trackId ?? src.track_id ?? src.music_id,
    name: src.name ?? src.title,
    author:
      src.author ??
      src.artist ??
      src.owner?.nickname ??
      src.uploader?.nickname ??
      src.user?.nickname,
    genre: src.genre,
    image: src.image ?? src.cover,
    likeCount:
      src.likeCount ??
      src.likesCount ??
      src.likes_count ??
      (typeof src.likes === "number" ? src.likes : null),
  };
}

function Catalog_window({ onPlayTrack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [allTracks, setAllTracks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [likedTrackIds, setLikedTrackIds] = useState(() => new Set());
  const [busyLikeId, setBusyLikeId] = useState(null);

  const loadLikeCounts = async (trackList) =>
    Promise.all(
      trackList.map(async (track) => {
        if (track.likeCount != null) return track;

        try {
          const result = await api.get(`/tracks/${track.id}/likes`);
          return { ...track, likeCount: readLikeCount(result) };
        } catch {
          return { ...track, likeCount: null };
        }
      }),
    );

  const loadDefault = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api.get("/tracks", { auth: false });
      const rawTracks = extractList(result)
        .map(toTrack)
        .filter((track) => track.id != null);

      const tracksWithCounts = await loadLikeCounts(rawTracks);

      setAllTracks(tracksWithCounts);
      setTracks(tracksWithCounts);
    } catch (err) {
      setError(err.message || "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (query) => {
    const q = query.trim();

    if (!q) {
      await loadDefault();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.get(`/search?query=${encodeURIComponent(q)}`, {
        auth: false,
      });

      const rawTracks = extractList(result)
        .map(toTrack)
        .filter((track) => track.id != null);

      setTracks(await loadLikeCounts(rawTracks));
    } catch (err) {
      setError(err.message || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefault();
  }, []);

  const toggleLike = async (track) => {
    if (track.id == null || busyLikeId != null) return;

    const currentlyLiked = likedTrackIds.has(track.id);

    setBusyLikeId(track.id);
    setLikeError("");

    try {
      if (currentlyLiked) {
        await api.delete(`/tracks/${track.id}/like`);

        setLikedTrackIds((current) => {
          const next = new Set(current);
          next.delete(track.id);
          return next;
        });

        updateLikeCount(track.id, -1);
      } else {
        await api.post(`/tracks/${track.id}/like`);

        setLikedTrackIds((current) => new Set(current).add(track.id));
        updateLikeCount(track.id, 1);
      }
    } catch (err) {
      setLikeError(err.message || "Не удалось обновить отметку «Нравится»");
    } finally {
      setBusyLikeId(null);
    }
  };

  const updateLikeCount = (trackId, change) => {
    const update = (list) =>
      list.map((track) =>
        track.id === trackId && track.likeCount != null
          ? { ...track, likeCount: Math.max(0, track.likeCount + change) }
          : track,
      );

    setTracks(update);
    setAllTracks(update);
  };

  // Author cards and counts are based on the full catalog.
  const authors = Array.from(
    new Set(allTracks.map((track) => track.author).filter(Boolean)),
  ).map((name) => ({
    name,
    count: allTracks.filter((track) => track.author === name).length,
  }));

  const visibleTracks = selectedAuthor
    ? tracks.filter((track) => track.author === selectedAuthor)
    : tracks;

  return (
    <div className="catalog">
      <div className="catalog__search-container">
        <div className="catalog__search-wrapper">
          <Search size={18} className="catalog__search-icon" />
          <input
            className="catalog__search-input"
            placeholder="Поиск Песен, Артистов, Плейлистов"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch(searchQuery);
            }}
          />
        </div>

        <button
          className="catalog__search-btn"
          type="button"
          onClick={() => runSearch(searchQuery)}
        >
          Search
        </button>
      </div>

      <hr className="catalog__divider" />

      {loading && <p>Загрузка...</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}
      {likeError && <p style={{ color: "salmon" }}>{likeError}</p>}

      {!loading && !error && (
        <>
          <section className="catalog__section">
            <div className="catalog__authors">
              {authors.map((author) => (
                <button
                  key={author.name}
                  className={`author-card ${
                    selectedAuthor === author.name ? "author-card--active" : ""
                  }`}
                  type="button"
                  onClick={() =>
                    setSelectedAuthor((current) =>
                      current === author.name ? null : author.name,
                    )
                  }
                >
                  <span className="author-card__name">{author.name}</span>
                  <span className="author-card__count">
                    {author.count} Песен
                  </span>
                </button>
              ))}
            </div>
          </section>

          <hr className="catalog__divider" />

          <section className="catalog__section">
            <ul className="catalog__tracks">
              {visibleTracks.map((track) => {
                const isLiked = likedTrackIds.has(track.id);

                return (
                  <li key={track.id} className="track-row">
                    <button
                      className="track-row__play"
                      type="button"
                      onClick={() => onPlayTrack?.(track)}
                      aria-label={`Play ${track.name ?? "track"}`}
                    >
                      <Play size={18} />
                    </button>

                    <div className="track-row__cover">
                      <img
                        src={imageUrl(track.image)}
                        onError={onImgError}
                        alt={track.name ?? ""}
                      />
                    </div>

                    <div className="track-row__info">
                      <span className="track-row__title">
                        {track.name ?? "Без названия"}
                      </span>
                      <span className="track-row__artist">
                        {track.author ?? "Неизвестный автор"}
                      </span>
                    </div>

                    <span className="track-row__genre">
                      {track.likeCount == null ? "♥ —" : `♥ ${track.likeCount}`}
                    </span>

                    <span className="track-row__duration">—</span>

                    <button
                      className={`track-row__action ${
                        isLiked ? "track-row__action--liked" : ""
                      }`}
                      type="button"
                      aria-label={isLiked ? "Unlike" : "Like"}
                      aria-pressed={isLiked}
                      disabled={busyLikeId === track.id}
                      onClick={() => toggleLike(track)}
                    >
                      <Heart
                        size={16}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                    </button>

                    <button
                      className="track-row__action"
                      type="button"
                      aria-label="More"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

export default Catalog_window;
