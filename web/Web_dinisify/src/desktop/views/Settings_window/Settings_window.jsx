import { useEffect, useState } from "react";
import { Save, Key, LogOut, AlertTriangle, CheckCircle } from "lucide-react";
// ИСПОЛЬЗУЕМ АЛИАС. Если api лежит в src/api, то @/api/userApi
import { userApi } from "shared/api/userApi";
// Если api в shared, используй: import { userApi } from "shared/api/userApi";
import { api } from "shared/hooks/client.js";
import "./Settings_window.css";

function Settings_window({ auth }) {
  const user = auth?.user;

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileOk, setProfileOk] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  // Загружаем профиль из БД, чтобы подтянуть email
  useEffect(() => {
    if (user?.id) {
      userApi
        .getProfile(user.id)
        .then((profile) => {
          setEmail(profile.email || "");
          setNickname(profile.nickname || user.name || "");
        })
        .catch((err) => console.error("Ошибка загрузки профиля:", err));
    }
  }, [user?.id, user?.name]);

  const refreshAuth = async () => {
    if (typeof auth?.fetchMe === "function") {
      try {
        await auth.fetchMe();
      } catch {
        /* ignore */
      }
    }
  };

  const saveProfile = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) return setProfileMsg("Вы не авторизованы");

    const nick = nickname.trim();
    const mail = email.trim();

    if (!nick) return setProfileMsg("Введите имя");

    setProfileSaving(true);
    setProfileMsg("");
    try {
      await userApi.updateProfile(user.id, {
        nickname: nick,
        email: mail || undefined,
      });
      await refreshAuth();
      setProfileMsg("✓ Профиль сохранён");
      setProfileOk(true);
    } catch (err) {
      setProfileMsg(err.message || "Не удалось сохранить профиль");
      setProfileOk(false);
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) return;

    if (!oldPassword || !newPassword) return setPwdMsg("Заполните оба поля");
    if (newPassword !== confirmPassword)
      return setPwdMsg("Пароли не совпадают");

    setPwdSaving(true);
    setPwdMsg("");
    try {
      await api.put(`/users/${user.id}/password`, { oldPassword, newPassword });
      setPwdMsg("✓ Пароль изменён");
      setPwdOk(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdMsg(err.message || "Не удалось сменить пароль");
      setPwdOk(false);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    auth?.logout?.();
    window.location.reload();
  };

  if (auth?.isGuest) {
    return (
      <div className="settings">
        <h1 className="settings__title">Настройки</h1>
        <div className="settings__card">
          <p style={{ color: "#888" }}>Войдите, чтобы изменить настройки.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <h1 className="settings__title">Настройки</h1>

      <form className="settings__card" onSubmit={saveProfile}>
        <h2 className="settings__section-title">Профиль</h2>

        {profileMsg && (
          <div
            className={`settings__msg ${profileOk ? "settings__msg--ok" : ""}`}
          >
            {profileOk ? (
              <CheckCircle size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}{" "}
            {profileMsg}
          </div>
        )}

        <div className="settings__group">
          <label htmlFor="nickname">Имя пользователя</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Например: dinis"
          />
        </div>

        <div className="settings__group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          className="settings__save-btn"
          disabled={profileSaving}
        >
          <Save size={16} /> {profileSaving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>

      <form className="settings__card" onSubmit={savePassword}>
        <h2 className="settings__section-title">
          <Key size={16} /> Смена пароля
        </h2>

        {pwdMsg && (
          <div className={`settings__msg ${pwdOk ? "settings__msg--ok" : ""}`}>
            {pwdOk ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}{" "}
            {pwdMsg}
          </div>
        )}

        <div className="settings__group">
          <label>Текущий пароль</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="settings__group">
          <label>Новый пароль</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="settings__group">
          <label>Подтвердите новый пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="settings__save-btn"
          disabled={pwdSaving}
        >
          <Key size={16} /> {pwdSaving ? "Сохранение..." : "Сменить пароль"}
        </button>
      </form>

      <div className="settings__card">
        <h2 className="settings__section-title">Сессия</h2>
        <button
          type="button"
          className="settings__logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={16} /> Выйти
        </button>
      </div>
    </div>
  );
}

export default Settings_window;
