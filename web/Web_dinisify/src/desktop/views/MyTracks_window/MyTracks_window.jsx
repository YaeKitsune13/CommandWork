import { useEffect, useState, useCallback } from "react";
import { Upload, X, Music, Clock, CheckCircle, XCircle } from "lucide-react";
import { trackApi } from "shared/api/trackApi";
import { useUploadTrack } from "shared/hooks/useUploadTrack";
import { imageUrl, onImgError } from "shared/fallbackImage";
import "./MyTracks_window.css";

function MyTracks_window({ auth }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    upload,
    progress,
    loading: uploading,
    error: uploadError,
  } = useUploadTrack();

  const userId = auth?.user?.id;
  const isGuest = auth?.isGuest || !userId;

  const loadTracks = useCallback(async () => {
    if (!userId) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await trackApi.getUserTracks(userId);
      const items = Array.isArray(result) ? result : result?.items || [];
      setTracks(items.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Ошибка загрузки треков:", err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const res = await upload({
      audioFile: fd.get("AudioFile"),
      name: fd.get("Name"),
      image: fd.get("Image")?.size > 0 ? fd.get("Image") : null,
    });

    if (res.success) {
      setIsModalOpen(false);
      await loadTracks();
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

      {loading && <p>Загрузка...</p>}

      {!loading && !isGuest && tracks.length === 0 && (
        <div className="my-tracks__empty">
          <Music size={64} strokeWidth={1} />
          <h2>Здесь пока пусто</h2>
          <p>
            Загрузите первый трек — после проверки модератором он появится в
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
              {uploadError && (
                <p style={{ color: "salmon", marginBottom: 12 }}>
                  {uploadError}
                </p>
              )}

              <div className="form-field">
                <label>Название трека *</label>
                <input name="Name" type="text" required />
              </div>
              <div className="file-input">
                <label>Аудиофайл (mp3/wav) *</label>
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
                {uploading
                  ? `Загрузка... ${progress}%`
                  : "Отправить на модерацию"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTracks_window;
