import { useEffect, useState } from "react";
import { Music, Flag, Check, X, AlertCircle } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./mod.css";

const API_HOST = "http://127.0.0.1:5000/api";

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys)
    if (obj[k] != undefined && obj[k] != null) return obj[k];
  return undefined;
};

const listFrom = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  for (const k of [
    "items",
    "data",
    "tracks",
    "music",
    "complaints",
    "results",
  ]) {
    if (Array.isArray(result[k])) return result[k];
  }
  return [];
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

  const [tab, setTab] = useState("music");

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Панель модератора</h1>
        <div className="admin__tabs">
          <button
            type="button"
            className={`admin__tab ${tab == "music" ? "admin__tab--active" : ""}`}
            onClick={() => setTab("music")}
          >
            <Music size={16} /> Заявки на треки
          </button>
          <button
            type="button"
            className={`admin__tab ${tab == "complaints" ? "admin__tab--active" : ""}`}
            onClick={() => setTab("complaints")}
          >
            <Flag size={16} /> Жалобы
          </button>
        </div>
      </div>

      <div className="admin__content">
        {tab === "music" && <MusicApprovals />}
        {tab === "complaints" && <ComplaintsPanel />}
      </div>
    </div>
  );
}

function MusicApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/moderator/music/pending")
      .then((result) => setItems(listFrom(result)))
      .catch((err) => setError(err.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (trackId, approved) => {
    setBusyId(trackId);
    try {
      await api.put("/moderator/music/review", { musicId: trackId, approved });
      setItems((prev) =>
        prev.filter((t) => pick(t, "id", "track_id", "music_id") !== trackId),
      );
    } catch (err) {
      alert(err.message || "Не удалось сохранить решение");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="admin__msg">Загрузка заявок...</p>;
  if (error) return <p className="admin__msg admin__msg--error">{error}</p>;
  if (items.length == 0)
    return <p className="admin__msg">Нет треков на модерации</p>;

  return (
    <ul className="admin-list">
      {items.map((item) => {
        const id = pick(item, "id", "track_id", "music_id");
        const name = pick(item, "name", "title") ?? "Без названия";
        const author = pick(item, "author", "artist") ?? "—";
        const genre = pick(item, "genre") ?? "";
        const image = pick(item, "image", "cover");
        const uploaderId = pick(
          item,
          "user_id",
          "userId",
          "owner_id",
          "ownerId",
        );

        return (
          <li key={id} className="admin-item">
            <div className="admin-item__cover">
              <img src={imageUrl(image)} onError={onImgError} alt={name} />
            </div>

            <div className="admin-item__info">
              <span className="admin-item__title">{name}</span>
              <span className="admin-item__meta">
                {author}
                {genre ? ` · ${genre}` : ""}
              </span>
              {uploaderId !== undefined && (
                <span className="admin-item__meta admin-item__meta--small">
                  Автор ID: {uploaderId}
                </span>
              )}
            </div>

            <div className="admin-item__audio">
              <audio
                controls
                preload="none"
                src={`${API_HOST}/music/sound?id=${id}`}
              />
            </div>

            <div className="admin-item__actions">
              <button
                type="button"
                className="admin-btn admin-btn--approve"
                disabled={busyId == id}
                onClick={() => review(id, true)}
              >
                <Check size={16} /> Одобрить
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--reject"
                disabled={busyId == id}
                onClick={() => review(id, false)}
              >
                <X size={16} /> Отклонить
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ComplaintsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
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
      setItems((prev) =>
        prev.filter((c) => pick(c, "id", "complaint_id") !== id),
      );
    } catch (err) {
      alert(err.message || "Не удалось обработать жалобу");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="admin__msg">Загрузка жалоб...</p>;
  if (error) return <p className="admin__msg admin__msg--error">{error}</p>;
  if (items.length == 0)
    return <p className="admin__msg">Активных жалоб нет</p>;

  return (
    <ul className="admin-list">
      {items.map((c) => {
        const id = pick(c, "id", "complaint_id");
        const reporter = pick(
          c,
          "user_id",
          "userId",
          "from_user_id",
          "reporter_id",
        );
        const targetType = pick(c, "target_type", "targetType") ?? "—";
        const targetId = pick(c, "target_id", "targetId");
        const text = pick(c, "text", "reason", "message", "description") ?? "";
        const status = pick(c, "status") ?? "open";
        const createdAt = pick(c, "created_at", "createdAt");

        return (
          <li key={id} className="admin-item">
            <div className="admin-item__badge">
              <Flag size={18} />
            </div>

            <div className="admin-item__info">
              <span className="admin-item__title">
                Жалоба #{id} → {targetType}
                {targetId != undefined ? ` #${targetId}` : ""}
              </span>
              <span className="admin-item__meta">
                От пользователя: {reporter ?? "—"}
              </span>
              {text && <span className="admin-item__text">{text}</span>}
              {createdAt && (
                <span className="admin-item__meta admin-item__meta--small">
                  {new Date(createdAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="admin-item__actions">
              <button
                type="button"
                className="admin-btn admin-btn--approve"
                disabled={busyId == id || status != "open"}
                onClick={() => resolve(id)}
              >
                <Check size={16} /> {status == "open" ? "Обработать" : status}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default Moderation_window;
