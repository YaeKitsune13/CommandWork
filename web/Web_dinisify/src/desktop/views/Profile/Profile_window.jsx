import { useEffect, useState } from "react";
import { Mail, Edit2, Check, X, LogOut } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./Profile_window.css";

function Profile_window({ auth, onLogout }) {
  const user = auth?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setNickname(user.name || "");
      setEmail(user.email || "");
    }
  }, [user, isEditing]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError("");

    try {
      await api.put(`/users/${user.id}`, {
        nickname,
        email,
        phone: null,
        image: null,
        privacy: "public",
      });
      auth.setLocalName?.(nickname);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div style={{ padding: 24 }}>Загрузка профиля...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__avatar">
            {user.image ? (
              <img src={imageUrl(user.image)} onError={onImgError} alt="" />
            ) : (
              user.name?.[0]?.toUpperCase() || "U"
            )}
          </div>

          <div className="profile-card__info">
            <h2>{user.name || "Без имени"}</h2>
            <p>
              <Mail size={14} /> {user.email || "Email скрыт"}
            </p>
            <span className="profile-card__role">{user.role}</span>
          </div>
        </div>

        <hr className="profile-card__divider" />

        {isEditing ? (
          <form onSubmit={handleSave} className="profile-card__form">
            {error && <div className="profile-card__error">{error}</div>}

            <div className="profile-input-group">
              <label>Имя пользователя (Никнейм)</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>

            <div className="profile-input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="profile-card__actions">
              <button type="submit" className="btn-save" disabled={saving}>
                <Check size={16} /> {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                <X size={16} /> Отмена
              </button>
            </div>
          </form>
        ) : (
          <div
            className="profile-card__actions"
            style={{ justifyContent: "space-between" }}
          >
            <button
              type="button"
              className="btn-edit"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} /> Редактировать профиль
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onLogout}
              style={{ width: "auto" }}
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default Profile_window;
