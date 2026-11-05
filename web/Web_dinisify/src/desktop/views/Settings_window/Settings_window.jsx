import { useEffect, useState } from "react";
import {
  Save,
  Key,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { api } from "shared/hooks/client.js";
import "./Settings_window.css";

function Settings_window({ auth }) {
  const user = auth?.user;

  // Profile form
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileOk, setProfileOk] = useState(false);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  // Artist status (informational)
  const [artistExists, setArtistExists] = useState(null);

  // Sync from auth.user whenever it changes
  useEffect(() => {
    setNickname(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.id, user?.name, user?.email]);

  // Check whether an artist row exists for the current name
  useEffect(() => {
    if (!user?.name) {
      setArtistExists(false);
      return;
    }
    let cancelled = false;
    api
      .get(`/search?query=${encodeURIComponent(user.name)}`, { auth: false })
      .then((result) => {
        if (cancelled) return;
        const artists = result?.artists ?? [];
        const norm = (s) =>
          typeof s === "string" ? s.trim().toLowerCase() : "";
        const found = artists.some(
          (a) => norm(a.name ?? a.Name) === norm(user.name),
        );
        setArtistExists(found);
      })
      .catch(() => {
        if (!cancelled) setArtistExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.name]);

  const refreshAuth = async () => {
    if (typeof auth?.fetchMe === "function") {
      try {
        await auth.fetchMe();
      } catch {
        /* ignore */
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Save profile                                                      */
  /* ---------------------------------------------------------------- */
  const saveProfile = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) {
      setProfileMsg("Вы не авторизованы");
      setProfileOk(false);
      return;
    }

    const nick = nickname.trim();
    const mail = email.trim();

    if (!nick) {
      setProfileMsg("Введите имя — без него загрузка треков невозможна");
      setProfileOk(false);
      return;
    }
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) {
      setProfileMsg("Некорректный email");
      setProfileOk(false);
      return;
    }

    setProfileSaving(true);
    setProfileMsg("");
    try {
      // Send both `name` and `nickname` — backend DTO may use either
      const payload = {
        nickname: nick,
        name: nick,
        email: mail || undefined,
      };
      await api.put(`/users/${user.id}`, payload);

      // Refresh auth state so auth.user.name is the new value immediately
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

  /* ---------------------------------------------------------------- */
  /* Change password                                                   */
  /* ---------------------------------------------------------------- */
  const savePassword = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) return;

    if (!oldPassword || !newPassword) {
      setPwdMsg("Заполните оба поля");
      setPwdOk(false);
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg("Пароль слишком короткий (минимум 6 символов)");
      setPwdOk(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg("Пароли не совпадают");
      setPwdOk(false);
      return;
    }

    setPwdSaving(true);
    setPwdMsg("");
    try {
      await api.put(`/users/${user.id}/password`, {
        oldPassword,
        newPassword,
      });
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

  /* ---------------------------------------------------------------- */
  /* Logout                                                            */
  /* ---------------------------------------------------------------- */
  const handleLogout = () => {
    auth?.logout?.();
    // App.jsx should navigate back to catalog after logout;
    // if not, this fires a reload as a safe fallback.
    window.location.reload();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  if (auth?.isGuest) {
    return (
      <div className="settings">
        <h1 className="settings__title">Настройки</h1>
        <div className="settings__card">
          <p style={{ color: "#888" }}>
            Войдите, чтобы изменить профиль и настройки аккаунта.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <h1 className="settings__title">Настройки</h1>

      {/* Debug panel — remove after everything works */}
      <details className="settings__debug">
        <summary>Debug: текущий auth.user</summary>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <p style={{ color: "#888", margin: "8px 0 0" }}>
          artist row exists: <b>{String(artistExists)}</b>
        </p>
      </details>

      {/* Profile card */}
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
          <label htmlFor="nickname">
            Имя пользователя <span style={{ color: "#E5383B" }}>*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Например: dinis или Dinis K."
            autoComplete="nickname"
          />
          <small style={{ color: "#666", fontSize: 12 }}>
            Это имя будет использоваться как имя артиста при загрузке треков.
          </small>
        </div>

        <div className="settings__group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          className="settings__save-btn"
          disabled={profileSaving}
        >
          <Save size={16} />{" "}
          {profileSaving ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </form>

      {/* Post-save hint about artist seeding */}
      {profileOk && artistExists === false && (
        <div className="settings__card settings__card--warning">
          <h3
            style={{
              margin: "0 0 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} /> Профиль сохранён, но загрузка пока не
            работает
          </h3>
          <p style={{ margin: "0 0 8px", color: "#ccc" }}>
            В базе ещё нет записи артиста с именем <b>«{nickname}»</b>.
            Попросите бэкенд-разработчика добавить запись, или выполните команду
            ниже (это одноразово, в консоли на сервере):
          </p>
          <pre className="settings__code">
            {`sudo docker exec -it mysql_coop_project \\
  mysql -uroot -p1234 -D coop_project \\
  -e "INSERT INTO \\\`artist\\\` (name) VALUES ('${nickname}');"`}
          </pre>
          <p style={{ margin: 0, color: "#888", fontSize: 12 }}>
            После этого перезайдите в аккаунт — имя появится в системе артистов
            и кнопка «Загрузить трек» начнёт работать.
          </p>
        </div>
      )}

      {profileOk && artistExists === true && (
        <div className="settings__card settings__card--success">
          <CheckCircle size={16} /> Запись артиста найдена — можно загружать
          треки.
        </div>
      )}

      {/* Password card */}
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
          <label htmlFor="oldPassword">Текущий пароль</label>
          <input
            id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="settings__group">
          <label htmlFor="newPassword">Новый пароль</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="settings__group">
          <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
        <p style={{ margin: "0 0 12px", color: "#888", fontSize: 13 }}>
          Выйти из аккаунта на этом устройстве.
        </p>
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
