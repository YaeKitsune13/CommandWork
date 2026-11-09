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
  const [uploading, setUploading] = useState(false);

  const isGuest = auth?.isGuest || auth?.role === "guest" || !auth?.user?.id;

  const loadTracks = async () => {
    if (!auth?.user?.id) {
      setTracks([]);
      setLoading(false);
      return;
    }

    const resolveArtist = async () => {
      // Проверяем, вдруг бэкенд уже добавил artistId в /auth/me
      if (auth?.user?.artistId) {
        setArtistId(auth.user.artistId);
        return auth.user.artistId;
      }

      // Если нет, ищем по имени через поиск (как делали раньше)
      try {
        const name = auth?.user?.name;
        if (name) {
          const res = await api.get(
            `/search?query=${encodeURIComponent(name)}`,
            { auth: false },
          );
          const artists = res?.artists ?? [];
          const found = artists.find(
            (a) => a.name?.toLowerCase() === name.toLowerCase(),
          );
          if (found) {
            setArtistId(found.id);
            return found.id;
          }
        }
      } catch (err) {
        console.error("Не удалось найти артиста", err);
      }
      return null;
    };

    resolveArtist().then((id) => {
      if (id) loadTracks(id);
      else setLoading(false);
    });
  }, [auth?.user?.id, auth?.user?.name, isGuest]);

  // 2. Загружаем треки по новому эндпоинту
  const loadTracks = async (artId) => {
    setLoading(true);
    try {
      const result = await api.get(`/users/${auth.user.id}/tracks`);
      const items = result?.items || (Array.isArray(result) ? result : []);
      setTracks(items.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error(err);
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

    // Чистим пустые файлы
    for (const [key, val] of [...fd.entries()]) {
      if (val instanceof File && val.size === 0) {
        fd.delete(key);
      }
    }

    if (!fd.get("Name")?.toString().trim())
      return setMsg("Укажите название трека");

    const audioFile = fd.get("AudioFile");
    if (!audioFile?.size) return setMsg("Выберите аудиофайл");

    if (audioFile.name.toLowerCase().endsWith(".m4a")) {
      setMsg(
        "Формат .m4a пока не поддерживается сервером. Пожалуйста, загрузите .mp3 или .wav",
      );
      return;
    }

    setMsg("");
    setUploading(true);
    try {
      await api.post("/tracks", fd);
      setMsg("✓ Трек отправлен на модерацию");
      setMsgOk(true);
      setIsModalOpen(false);
      form.reset();

      // Обновляем список, если знаем artistId
      if (artistId) loadTracks(artistId);
    } catch (err) {
      const errorMsg = err.fields
        ? Object.values(err.fields).flat().join(", ")
        : err.message;
      setMsg(errorMsg || "Не удалось загрузить трек");
      setMsgOk(false);
    } finally {
      setUploading(false);
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
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={isGuest}
        >
          <Upload size={18} /> Загрузить трек
        </button>
      </div>

      {msg && (
        <div className={`my-tracks__msg ${msgOk ? "my-tracks__msg--ok" : ""}`}>
          {msg}
        </div>
      )}

      {loading && <p>Загрузка...</p>}

      {!loading && !isGuest && tracks.length === 0 && (
        <div className="my-tracks__empty">
          <Music size={64} strokeWidth={1} />
          <h2>Здесь пока пусто</h2>
          <p>
            Загрузите первый трек — после одобрения модератором он появится в
            каталоге.
          </p>
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
                  <div className="track-card__title">{track.name}</div>
                  <div className="track-card__author">
                    {track.owner?.nickname || "Вы"}
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
                <input name="Name" type="text" required />
              </div>
              <div className="file-input">
                <label>Аудиофайл *</label>
                <input name="AudioFile" type="file" accept="audio/*" required />
              </div>
              <div className="file-input">
                <label>Обложка (опционально)</label>
                <input name="Image" type="file" accept="image/*" />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? "Отправка..." : "Отправить на модерацию"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MyTracks_window;
