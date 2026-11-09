import { useState } from "react";
import { LogIn, ArrowLeft } from "lucide-react";
import "./Login_window.css";

function Login_window({ auth, onLoginSuccess, onCancel, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Заполните все поля.");

    setError("");
    setBusy(true);
    const res = await auth.login(email, password);
    setBusy(false);

    if (res.success) {
      onLoginSuccess?.();
    } else {
      setError(res.error || "Неверный email или пароль");
    }
  };

  return (
    <div className="login-container">
      <button type="button" className="login-back-btn" onClick={onCancel}>
        <ArrowLeft size={18} /> Вернуться в каталог
      </button>

      <div className="login-card">
        <h2 className="login-title">С возвращением</h2>
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={busy}
              required
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
              disabled={busy}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={busy}>
            <LogIn size={18} /> {busy ? "Вход..." : "Войти"}
          </button>
        </form>

        <div className="login-footer">
          Нету аккаунта?{" "}
          <span className="login-link" onClick={onGoToRegister}>
            Создайте
          </span>
        </div>
      </div>
    </div>
  );
}
export default Login_window;
