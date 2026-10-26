import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";
import "./Register_window.css";

function Register_window({ onRegisterSuccess, onGoToLogin, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (
      username.length == 0 ||
      password.length == 0 ||
      confirmPassword.length == 0
    ) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setError("");
    // =====================================================================
    // В реальном приложении здесь будет POST-запрос к /auth/register
    onRegisterSuccess("user");
    // =====================================================================
  };

  return (
    <div className="register-container"> {/* Fixed lowercase 'r' */}
      <button type="button" className="register-back-btn" onClick={onCancel}>
        <ArrowLeft size={18} /> Вернуться в каталог
      </button>

      <div className="register-card">
        <h2 className="register-title">Создать аккаунт</h2>
        <p className="register-subtitle">Присоединяйтесь к Dinisify</p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-input-group">
            <label htmlFor="username">Email или Логин</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите ваш email"
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
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
            />
          </div>

          <button type="submit" className="register-submit-btn">
            <UserPlus size={18} /> Зарегистрироваться
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