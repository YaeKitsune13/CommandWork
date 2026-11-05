import { useEffect, useState } from "react";
import { Upload, X, Music, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./MyTracks_window.css";

function MyTracks_window({ auth }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const loadTracks = async () => {
    const userId = auth?.user?.id;
    if (!userId) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Endpoint does not exist yet — will 404. Catch and show empty state.
      const result = await api.get(`/users/${userId}/tracks`);
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setTracks(items);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [auth?.user?.id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Strip empty file inputs (image is often unselected)
    for (const [key, val] of [...fd.entries()]) {
      if (val instanceof File && val.size === 0) fd.delete(key);
    }

    if (!fd.get("AudioFile")?.size) {
      setMsg("Пожалуйста, выберите аудиофайл");
      setMsgOk(false);
      return;
    }

    setMsg("");
    try {
      await api.post("/music", fd);
      setMsg("✓ Трек отправлен на модерацию");
      setMsgOk(true);
      setIsModalOpen(false);
      form.reset();
      loadTracks();
    } catch (err) {
      setMsg(err.message || "Не удалось загрузить трек");
      setMsgOk(false);
    }
  };

  const statusMeta = (status) => {
    switch (status) {
      case "pending":
        return { text: "На модерации", Icon: Clock, cls: "pending" };
      case "approved":
        return { text: "Одобрен", Icon: CheckCircle, cls: "approved" };
      case "rejected":
        return { text: "Отклонён", Icon: XCircle, cls: "rejected" };
      default:
        return { text: status || "—", Icon: null, cls: "" };
    }
  };

  return (
    <div className="my-tracks">
      <div className="my-tracks__header">
        <h1>Мои треки</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Upload size={18} /> Загрузить трек
        </button>
      </div>

      {msg && (
        <div className={`my-tracks__msg ${msgOk ? "my-tracks__msg--ok" : ""}`}>
          {msg}
        </div>
      )}

      {loading && <p className="my-tracks__hint">Загрузка...</p>}

      {!loading && tracks.length === 0 && (
        <div className="my-tracks__empty">
          <Music size={64} strokeWidth={1} />
          <h2>Здесь пока пусто</h2>
          <p>
            Загрузите свой первый трек — после проверки модератором он появится
            в общем каталоге.
          </p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Upload size={18} /> Загрузить трек
          </button>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="my-tracks__grid">
          {tracks.map((track) => {
            const s = statusMeta(track.status);
            const Icon = s.Icon;
            return (
              <div key={track.id} className="track-card">
                <div className="track-card__cover">
                  <img
                    src={imageUrl(track.image)}
                    onError={onImgError}
                    alt={track.name}
                  />
                </div>
                <div className="track-card__body">
                  <div className="track-card__title" title={track.name}>
                    {track.name || "Без названия"}
                  </div>
                  <div className="track-card__author">
                    {track.author || "—"}
                  </div>
                  <div
                    className={`track-card__status track-card__status--${s.cls}`}
                  >
                    {Icon && <Icon size={12} />} {s.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Загрузить трек</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleUpload}>
              <div className="form-field">
                <label>Название трека *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Например: Midnight Rain"
                  required
                />
              </div>
              <div className="form-field">
                <label>Исполнитель</label>
                <input
                  name="author"
                  type="text"
                  placeholder="Ваше имя или псевдоним"
                />
              </div>
              <div className="form-field">
                <label>Жанр</label>
                <input
                  name="genre"
                  type="text"
                  placeholder="Rock, Hip-Hop, Jazz..."
                />
              </div>
              <div className="file-input">
                <label>Аудиофайл (mp3/wav/m4a) *</label>
                <input name="AudioFile" type="file" accept="audio/*" required />
              </div>
              <div className="file-input">
                <label>Обложка (опционально)</label>
                <input name="image" type="file" accept="image/*" />
              </div>
              <button type="submit" className="btn-primary">
                Отправить на модерацию
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTracks_window;
