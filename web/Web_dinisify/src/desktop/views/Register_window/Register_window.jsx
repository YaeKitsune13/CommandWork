import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";
import "./Register_window.css";

function Register_window({ auth, onRegisterSuccess, onGoToLogin, onCancel }) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !nickname.trim() || !password) {
      return setError("Пожалуйста, заполните все поля.");
    }
    if (password !== confirmPassword) {
      return setError("Пароли не совпадают.");
    }

    setBusy(true);
    // Передаем nickname в метод регистрации (третий аргумент)
    const res = await auth.register(email.trim(), password, nickname.trim());
    setBusy(false);

    if (res.success) {
      onRegisterSuccess?.();
    } else {
      setError(res.error || "Не удалось зарегистрироваться");
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
              Имя пользователя (Никнейм){" "}
              <span style={{ color: "#E5383B" }}>*</span>
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Как вас показывать в приложении?"
              autoComplete="nickname"
              disabled={busy}
              required
            />
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
              required
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
              required
            />
          </div>

          <button type="submit" className="register-submit-btn" disabled={busy}>
            <UserPlus size={18} />{" "}
            {busy ? "Создание аккаунта..." : "Зарегистрироваться"}
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
