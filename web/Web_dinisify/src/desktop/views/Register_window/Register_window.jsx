import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";
import { api } from "shared/hooks/client.js";
import "./Register_window.css";

function Register_window({ auth, onRegisterSuccess, onGoToLogin, onCancel }) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | registering | profile | done

  const busy = status === "registering" || status === "profile";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimEmail = email.trim();
    const trimNickname = nickname.trim();

    if (!trimEmail || !trimNickname || !password || !confirmPassword) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimEmail)) {
      setError("Некорректный email.");
      return;
    }
    if (trimNickname.length < 2) {
      setError("Имя должно быть не короче 2 символов.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setStatus("registering");

    /* Step 1 — register + auto-login (useAuth does both) */
    const regResult = await auth.register(trimEmail, password);
    if (!regResult.success) {
      setError(regResult.error || "Не удалось зарегистрироваться");
      setStatus("idle");
      return;
    }

    /* Step 2 — save nickname */
    setStatus("profile");
    try {
      const me = await auth.fetchMe?.();
      const userId = me?.id ?? auth.user?.id;
      if (!userId) throw new Error("Не удалось получить ID пользователя");

      await api.put(`/users/${userId}`, {
        nickname: trimNickname,
        name: trimNickname,
        email: trimEmail,
      });

      /* Step 3 — refresh auth so auth.user.name is the new value everywhere */
      await auth.fetchMe?.();

      setStatus("done");
      onRegisterSuccess?.();
    } catch (err) {
      setError(
        `Аккаунт создан, но имя не сохранилось: ${err.message}. ` +
          `Вы можете изменить имя в Настройках.`,
      );
      setStatus("idle");
    }
  };

  return (
    <div className="register-container">
      <button type="button" className="register-back-btn" onClick={onCancel}>
        <ArrowLeft size={18} /> Вернуться в каталог
      </button>

      <div className="register-card">
        <h2 className="register-title">Создать аккаунт</h2>
        <p className="register-subtitle">Присоединяйтесь к Dinisify</p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={busy}
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="nickname">
              Имя артиста <span style={{ color: "#E5383B" }}>*</span>
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Как вас показывать в приложении?"
              autoComplete="nickname"
              disabled={busy}
            />
            <small style={{ color: "#888", fontSize: 12 }}>
              Это имя будет использоваться как имя артиста при загрузке треков.
            </small>
          </div>

          <div className="register-input-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
              disabled={busy}
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              disabled={busy}
            />
          </div>

          <button type="submit" className="register-submit-btn" disabled={busy}>
            <UserPlus size={18} />
            {status === "registering" && "Создание аккаунта..."}
            {status === "profile" && "Сохранение профиля..."}
            {(status === "idle" || status === "done") && "Зарегистрироваться"}
          </button>
        </form>

        <div className="register-footer">
          Уже есть аккаунт?{" "}
          <span className="register-link" onClick={onGoToLogin}>
            Войти
          </span>
        </div>
      </div>
    </div>
  );
}

export default Register_window;
