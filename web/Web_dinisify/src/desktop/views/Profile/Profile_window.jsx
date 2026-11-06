import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { api } from "shared/hooks/client.js";
import { imageUrl, onImgError } from "shared/fallbackImage.js";
import "./Profile_window.css";

function Profile_window({ userId, onLogout }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    api
      .get(`/users/${userId}`, { auth: false })
      .then(setUser)
      .catch((err) => setError(err.message));
  }, [userId]);

  if (error) return <p>{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="profile">
      <div className="profile__header">
        <div className="profile__avatar">
          {user.image ? (
            <img src={imageUrl(user.image)} onError={onImgError} alt="" />
          ) : (
            (user.nickname?.[0]?.toUpperCase() ?? "U")
          )}
        </div>
        <div className="profile__info">
          <h1 className="profile__name">{user.nickname || "Без имени"}</h1>
          <p className="profile__bio">{user.email}</p>
        </div>

        <button
          type="button"
          className="profile__logout-btn"
          onClick={onLogout}
          aria-label="Выйти из аккаунта"
        >
          <LogOut size={18} /> Выйти
        </button>
      </div>
    </div>
  );
}

export default Profile_window;
