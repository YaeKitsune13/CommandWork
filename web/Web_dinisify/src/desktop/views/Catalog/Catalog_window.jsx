import { useEffect, useState } from "react";
import { Search, Play, Heart, MoreHorizontal } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./Catalog_window.css";

// Defensive extractor: controllers may return a bare array or an envelope
// like { items | data | tracks | music: [...] }. Handle all.
function extractList(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  for (const k of ["items", "data", "tracks", "music", "results"]) {
    if (Array.isArray(result[k])) return result[k];
  }
  return [];
}

// Charts may wrap each item as { track: {...}, playCount: N } or return
// plain track objects. Normalize both to a flat track shape.
function toTrack(item) {
  const src = item?.track ?? item ?? {};
  return {
    id: src.id ?? src.track_id ?? src.music_id,
    name: src.name ?? src.title,
    author: src.author ?? src.artist,
    genre: src.genre,
    image: src.image ?? src.cover,
  };
}

function Catalog_window({ onPlayTrack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDefault = async () => {
    setLoading(true);
    setError("");
    try {
      // /charts accepts empty params and is AllowAnonymous.
      const result = await api.get("/charts?period=week&limit=50", {
        auth: false,
      });
      const items = extractList(result)
        .map(toTrack)
        .filter((t) => t.id);
      setTracks(items);
    } catch (err) {
      setError(err.message || "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (query) => {
    const q = query.trim();
    if (!q) {
      // Empty query → don't hit /search (it 400s). Fall back to the default list.
      return loadDefault();
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.get(`/search?query=${encodeURIComponent(q)}`, {
        auth: false,
      });
      const items = extractList(result)
        .map(toTrack)
        .filter((t) => t.id);
      setTracks(items);
    } catch (err) {
      setError(err.message || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefault();
  }, []);

  const authors = Array.from(
    new Map(
      tracks.map((t) => [
        t.author,
        { name: t.author, count: 0, photo: t.image },
      ]),
    ).values(),
  );
  tracks.forEach((t) => {
    const a = authors.find((x) => x.name === t.author);
    if (a) a.count += 1;
  });

  return (
    <div className="catalog">
      <div className="catalog__search-container">
        <div className="catalog__search-wrapper">
          <Search size={18} className="catalog__search-icon" />
          <input
            className="catalog__search-input"
            placeholder="Поиск Песен, Артистов, Плейлистов"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadTracks(searchQuery)}
          />
        </div>
        <button
          className="catalog__search-btn"
          onClick={() => loadTracks(searchQuery)}
        >
          Search
        </button>
      </div>

      <hr className="catalog__divider" />

      {loading && <p>Загрузка...</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      {!loading && !error && (
        <>
          <section className="catalog__section">
            <div className="catalog__authors">
              {authors.map((a) => (
                <button key={a.name} className="author-card" type="button">
                  <div className="author-card__image-wrapper">
                    <img
                      src={imageUrl(a.photo)}
                      onError={onImgError}
                      alt={a.name}
                      className="author-card__image"
                    />
                  </div>
                  <span className="author-card__name">{a.name || "—"}</span>
                  <span className="author-card__count">{a.count} Песен</span>
                </button>
              ))}
            </div>
          </section>

          <hr className="catalog__divider" />

          <section className="catalog__section">
            <ul className="catalog__tracks">
              {tracks.map((t) => (
                <li key={t.id} className="track-row">
                  <button
                    className="track-row__play"
                    onClick={() => onPlayTrack?.(t)}
                    aria-label="Play"
                  >
                    <Play size={18} />
                  </button>
                  <div className="track-row__cover">
                    <img
                      src={imageUrl(t.image)}
                      onError={onImgError}
                      alt={t.name}
                    />
                  </div>
                  <div className="track-row__info">
                    <span className="track-row__title">{t.name}</span>
                    <span className="track-row__artist">{t.author}</span>
                  </div>
                  <span className="track-row__genre">{t.genre}</span>
                  <span className="track-row__duration">—</span>
                  <button className="track-row__action" aria-label="Like">
                    <Heart size={16} />
                  </button>
                  <button className="track-row__action" aria-label="More">
                    <MoreHorizontal size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
export default Catalog_window;
