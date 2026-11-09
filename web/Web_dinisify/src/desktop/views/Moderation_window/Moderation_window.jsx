import { useEffect, useState } from "react";
import { Music, Flag, Check, X, AlertCircle } from "lucide-react";
import { api, apiFetch } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./mod.css";

const listFrom = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return result.items || [];
};

function Moderation_window({ auth }) {
  const isModerator =
    auth?.isModerator ?? (auth?.role === "moderator" || auth?.role === "admin");

  if (!isModerator) {
    return (
      <div className="admin-denied">
        <AlertCircle size={36} />
        <h2>Доступ запрещён</h2>
        <p>Эта страница доступна только модераторам и администраторам.</p>
      </div>
    );
  }

  const [tab, setTab] = useState("tracks");

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Панель модератора</h1>
        <div className="admin__tabs">
          <button
            type="button"
            className={`admin__tab ${tab === "tracks" ? "admin__tab--active" : ""}`}
            onClick={() => setTab("tracks")}
          >
            <Music size={16} /> Заявки на треки
          </button>
          <button
            type="button"
            className={`admin__tab ${tab === "complaints" ? "admin__tab--active" : ""}`}
            onClick={() => setTab("complaints")}
          >
            <Flag size={16} /> Жалобы
          </button>
        </div>
      </div>

      <div className="admin__content">
        {tab === "tracks" && <TrackApprovals />}
        {tab === "complaints" && <ComplaintsPanel />}
      </div>
    </div>
  );
}

/* ============================ КОМПОНЕНТ ПЛЕЕРА ============================ */
function AudioPreview({ track }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadAudio = async () => {
      try {
        // Бэкенд может отдавать streamUrl, fileUrl или мы падаем в fallback
        const url =
          track.streamUrl || track.fileUrl || `/api/tracks/${track.id}/stream`;
        const fullUrl = url.startsWith("http")
          ? url
          : `http://127.0.0.1:5000${url}`;

        // Используем наш apiFetch, который прикрепит Bearer Token
        const res = await fetch(fullUrl, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error("Не удалось загрузить аудио");

        const blob = await res.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [track]);

  if (loading)
    return (
      <span style={{ fontSize: 12, color: "#888" }}>Загрузка плеера...</span>
    );
  if (error)
    return <span style={{ fontSize: 12, color: "salmon" }}>Ошибка аудио</span>;

  return <audio controls src={blobUrl} style={{ height: 36, width: "100%" }} />;
}

/* ============================ ОДОБРЕНИЕ ТРЕКОВ ============================ */

function TrackApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/moderator/tracks/pending")
      .then((result) => setItems(listFrom(result)))
      .catch((err) => setError(err.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (trackId, isApproved) => {
    if (!isApproved && !rejectingId) {
      setRejectingId(trackId);
      setRejectReason("Не соответствует правилам");
      return;
    }

    setBusyId(trackId);
    try {
      await api.put(`/moderator/tracks/${trackId}/review`, {
        musicId: trackId,
        isApproved: isApproved,
        rejectionReason: isApproved ? null : rejectReason,
      });

      setItems((prev) => prev.filter((t) => t.id !== trackId));
      setRejectingId(null);
    } catch (err) {
      alert(err.message || "Не удалось сохранить решение");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="admin__msg">Загрузка заявок...</p>;
  if (error) return <p className="admin__msg admin__msg--error">{error}</p>;
  if (items.length === 0)
    return <p className="admin__msg">Нет треков на модерации 🎉</p>;

  return (
    <>
      <ul className="admin-list">
        {items.map((track) => (
          <li key={track.id} className="admin-item mod-card">
            <div className="admin-item__cover">
              <img
                src={imageUrl(track.image)}
                onError={onImgError}
                alt={track.name}
              />
            </div>

            <div className="admin-item__info">
              <span className="admin-item__title">
                {track.name || "Без названия"}
              </span>
              <span className="admin-item__meta">
                Автор: <b>{track.owner?.nickname || "Неизвестен"}</b>
              </span>
            </div>

            {/* ТЕПЕРЬ ИСПОЛЬЗУЕМ НОВЫЙ ПЛЕЕР */}
            <div className="admin-item__audio">
              <AudioPreview track={track} />
            </div>

            <div className="admin-item__actions">
              <button
                type="button"
                className="admin-btn admin-btn--approve"
                disabled={busyId === track.id}
                onClick={() => handleReview(track.id, true)}
              >
                <Check size={16} /> Одобрить
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--reject"
                disabled={busyId === track.id}
                onClick={() => handleReview(track.id, false)}
              >
                <X size={16} /> Отклонить
              </button>
            </div>
          </li>
        ))}
      </ul>

      {rejectingId && (
        <div className="modal-backdrop" onClick={() => setRejectingId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Причина отклонения</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="3"
              style={{ width: "100%", margin: "16px 0", padding: "10px" }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="admin-btn"
                onClick={() => setRejectingId(null)}
              >
                Отмена
              </button>
              <button
                className="admin-btn admin-btn--reject"
                onClick={() => handleReview(rejectingId, false)}
              >
                Отклонить трек
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =============================== ЖАЛОБЫ ============================== */

function ComplaintsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/moderator/complaints")
      .then((result) => setItems(listFrom(result)))
      .catch((err) => setError(err.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/moderator/complaints/${id}/resolve`);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message || "Не удалось обработать жалобу");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="admin__msg">Загрузка жалоб...</p>;
  if (error) return <p className="admin__msg admin__msg--error">{error}</p>;
  if (items.length === 0)
    return <p className="admin__msg">Активных жалоб нет</p>;

  return (
    <ul className="admin-list">
      {items.map((c) => (
        <li key={c.id} className="admin-item mod-card">
          <div className="admin-item__badge">
            <Flag size={18} />
          </div>
          <div className="admin-item__info">
            <span className="admin-item__title">
              Жалоба #{c.id} на {c.targetType} #{c.targetId}
            </span>
            <span className="admin-item__text">{c.reason}</span>
          </div>
          <div className="admin-item__actions">
            <button
              type="button"
              className="admin-btn admin-btn--approve"
              disabled={busyId === c.id}
              onClick={() => resolve(c.id)}
            >
              <Check size={16} /> Решено
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Moderation_window;
