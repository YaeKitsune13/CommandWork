import { useEffect, useState } from "react";
import { Plus, X, ListMusic, Lock } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./MyPlaylists_window.css";

function MyPlaylists_window({ auth }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);

  const isGuest = auth?.isGuest || auth?.role === "guest" || !auth?.user?.id;

  const loadPlaylists = async () => {
    if (!auth?.user?.id) {
      setPlaylists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.get("/playlists/my");
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setPlaylists(items);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.user?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();

    if (!name) {
      setMsg("Укажите название плейлиста");
      return;
    }

    setCreating(true);
    setMsg("");
    try {
      const created = await api.post("/playlists", {
        name,
        description: description || null,
        isPrivate: false,
      });
      setPlaylists((prev) => [...prev, created]);
      setIsModalOpen(false);
      form.reset();
    } catch (err) {
      setMsg(err.message || "Не удалось создать плейлист");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить плейлист?")) return;
    try {
      await api.del(`/playlists/${id}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setMsg(err.message || "Не удалось удалить плейлист");
    }
  };

  return (
    <div className="my-playlists">
      <div className="my-playlists__header">
        <h1>Мои плейлисты</h1>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={isGuest}
          title={isGuest ? "Войдите, чтобы создавать плейлисты" : undefined}
        >
          <Plus size={18} /> Создать плейлист
        </button>
      </div>

      {msg && <div className="my-playlists__msg">{msg}</div>}

      {loading && <p className="my-playlists__hint">Загрузка...</p>}

      {!loading && playlists.length === 0 && (
        <div className="my-playlists__empty">
          <ListMusic size={64} strokeWidth={1} />
          <h2>
            {isGuest
              ? "Войдите, чтобы видеть свои плейлисты"
              : "У вас пока нет плейлистов"}
          </h2>
          <p>
            {isGuest
              ? "После входа вы сможете собирать треки в плейлисты."
              : "Создайте первый плейлист, чтобы собирать любимые треки в одном месте."}
          </p>
          {!isGuest && (
            <button
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} /> Создать плейлист
            </button>
          )}
        </div>
      )}

      {!loading && playlists.length > 0 && (
        <div className="playlist-grid">
          {playlists.map((p) => (
            <div key={p.id} className="playlist-card">
              <div className="playlist-card__cover">
                {p.image ? (
                  <img
                    src={imageUrl(p.image)}
                    onError={onImgError}
                    alt={p.name}
                  />
                ) : (
                  <ListMusic size={32} strokeWidth={1} />
                )}
              </div>
              <div className="playlist-card__body">
                <div className="playlist-card__title">
                  {p.name || "Без названия"}
                  {p.isPrivate && <Lock size={12} style={{ marginLeft: 6 }} />}
                </div>
                <div className="playlist-card__count">
                  {p.tracksCount ?? p.tracks?.length ?? 0} треков
                </div>
              </div>
              <button
                type="button"
                className="playlist-card__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p.id);
                }}
                aria-label="Удалить"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новый плейлист</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-field">
                <label>Название *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Например: Late Night Drive"
                  required
                />
              </div>
              <div className="form-field">
                <label>Описание</label>
                <textarea
                  name="description"
                  placeholder="Необязательно"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? "Создание..." : "Создать"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPlaylists_window;
