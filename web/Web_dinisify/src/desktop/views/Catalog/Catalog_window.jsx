import { useEffect, useState } from "react";
import { Search, Play, Heart, MoreHorizontal } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./Catalog_window.css";

function Catalog_window({ onPlayTrack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTracks = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      // Теперь используем единый каталог /tracks
      const endpoint = query
        ? `/search?query=${encodeURIComponent(query)}`
        : `/tracks?page=1&pageSize=20`;

      const result = await api.get(endpoint, { auth: false });

      // Если это поиск, он может возвращать { tracks: [...] }, а если каталог, то { items: [...] }
      const items =
        result?.items ||
        result?.tracks ||
        (Array.isArray(result) ? result : []);
      setTracks(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks("");
  }, []);

  // Дедупликация авторов для верхней панели
  const authors = Array.from(
    new Map(
      tracks.map((t) => [
        t.owner?.id,
        {
          id: t.owner?.id,
          name: t.owner?.nickname,
          photo: t.owner?.image,
          count: 0,
        },
      ]),
    ).values(),
  ).filter((a) => a.id); // убираем пустых

  tracks.forEach((t) => {
    const a = authors.find((x) => x.id === t.owner?.id);
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

      {loading && <p style={{ padding: 16 }}>Загрузка...</p>}
      {error && <p style={{ padding: 16, color: "salmon" }}>{error}</p>}

      {!loading && !error && (
        <>
          <section className="catalog__section">
            <div className="catalog__authors">
              {authors.map((author) => (
                <button key={author.id} className="author-card" type="button">
                  <div className="author-card__image-wrapper">
                    <img
                      src={imageUrl(author.photo)}
                      onError={onImgError}
                      alt={author.name}
                      className="author-card__image"
                    />
                  </div>
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
              {tracks.map((track) => (
                <li key={track.id} className="track-row">
                  <button
                    className="track-row__play"
                    onClick={() => onPlayTrack?.(track)}
                    aria-label="Play"
                  >
                    <Play size={18} />
                  </button>
                  <div className="track-row__cover">
                    <img
                      src={imageUrl(track.image)}
                      onError={onImgError}
                      alt={track.name}
                    />
                  </div>
                  <div className="track-row__info">
                    <span className="track-row__title">{track.name}</span>
                    <span className="track-row__artist">
                      {track.owner?.nickname || "—"}
                    </span>
                  </div>
                  <span className="track-row__genre">—</span>
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
