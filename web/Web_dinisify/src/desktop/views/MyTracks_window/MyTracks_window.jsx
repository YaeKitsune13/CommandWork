import { useEffect, useState } from "react";
import {
  Upload,
  X,
  Music,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./MyTracks_window.css";

function MyTracks_window({ auth }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [artistId, setArtistId] = useState(null);
  const [artistError, setArtistError] = useState("");
  const [resolvingArtist, setResolvingArtist] = useState(false);

  const isGuest = auth?.isGuest || auth?.role === "guest" || !auth?.user?.id;

  const loadTracks = async () => {
    const userId = auth?.user?.id;
    if (!userId) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.get(`/users/${userId}/tracks`);
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setTracks(items);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveArtistId = async (name) => {
    if (!name) return null;
    try {
      const result = await api.get(
        `/search?query=${encodeURIComponent(name)}`,
        { auth: false },
      );
      const artists =
        result?.artists ?? result?.Artists ?? result?.artistsList ?? [];
      if (!Array.isArray(artists)) return null;

      const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
      const target = norm(name);

      const match = artists.find((a) => {
        const n = a.name ?? a.Name ?? a.nickname ?? a.Nickname;
        return norm(n) === target;
      });

      if (!match) return null;
      return match.id ?? match.Id ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isGuest) {
        setArtistId(null);
        setArtistError("");
        return;
      }
      setResolvingArtist(true);
      const id = await resolveArtistId(auth?.user?.name);
      if (cancelled) return;
      setResolvingArtist(false);
      setArtistId(id);
      setArtistError(
        id
          ? ""
          : `Профиль артиста для «${auth?.user?.name ?? "?"}» не найден в базе. ` +
              `Загрузка треков недоступна — обратитесь к администратору.`,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.user?.id, auth?.user?.name, isGuest]);

  useEffect(() => {
    loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.user?.id]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!artistId) {
      setMsg(
        artistError || "Профиль артиста не определён — загрузка невозможна",
      );
      setMsgOk(false);
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);

    for (const [key, val] of [...fd.entries()]) {
      if (val instanceof File && val.size === 0) fd.delete(key);
    }

    if (!fd.get("Name")?.toString().trim()) {
      setMsg("Укажите название трека");
      setMsgOk(false);
      return;
    }
    if (!fd.get("AudioFile")?.size) {
      setMsg("Выберите аудиофайл");
      setMsgOk(false);
      return;
    }

    // Inject the required ArtistId field
    fd.set("ArtistId", String(artistId));

    setMsg("");
    setUploading(true);
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
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Status meta                                                         */
  /* ------------------------------------------------------------------ */
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

  const canUpload = !isGuest && !!artistId && !resolvingArtist;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="my-tracks">
      <div className="my-tracks__header">
        <h1>Мои треки</h1>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={isGuest}
          title={isGuest ? "Войдите, чтобы загружать треки" : undefined}
        >
          <Upload size={18} /> Загрузить трек
        </button>
      </div>

      {msg && (
        <div className={`my-tracks__msg ${msgOk ? "my-tracks__msg--ok" : ""}`}>
          {msg}
        </div>
      )}

      {!isGuest && artistError && (
        <div className="my-tracks__warning">
          <AlertTriangle size={18} />
          <span>{artistError}</span>
        </div>
      )}

      {loading && <p className="my-tracks__hint">Загрузка...</p>}

      {!loading && tracks.length === 0 && (
        <div className="my-tracks__empty">
          <Music size={64} strokeWidth={1} />
          <h2>
            {isGuest ? "Войдите, чтобы видеть свои треки" : "Здесь пока пусто"}
          </h2>
          <p>
            {isGuest
              ? "После входа вы сможете загружать треки и отслеживать их статус."
              : "Загрузите первый трек — после одобрения модератором он появится в каталоге."}
          </p>
          {canUpload && (
            <button
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Upload size={18} /> Загрузить трек
            </button>
          )}
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
                    {track.artistName || track.author || "—"}
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

            {!artistId ? (
              <div className="modal-form">
                <p className="my-tracks__warning" style={{ margin: 0 }}>
                  <AlertTriangle size={16} />{" "}
                  {artistError || "Профиль артиста не найден"}
                </p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleUpload}>
                <div className="form-field">
                  <label>Название трека *</label>
                  <input
                    name="Name"
                    type="text"
                    placeholder="Например: Midnight Rain"
                    required
                  />
                </div>

                <div className="file-input">
                  <label>Аудиофайл (mp3 / wav / m4a) *</label>
                  <input
                    name="AudioFile"
                    type="file"
                    accept="audio/*"
                    required
                  />
                </div>

                <div className="file-input">
                  <label>Обложка (опционально)</label>
                  <input name="Image" type="file" accept="image/*" />
                </div>

                <p
                  className="my-tracks__hint"
                  style={{ margin: 0, fontSize: 12 }}
                >
                  Автор: <b>{auth?.user?.name}</b> · трек будет отправлен на
                  модерацию
                </p>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? "Отправка..." : "Отправить на модерацию"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTracks_window;
