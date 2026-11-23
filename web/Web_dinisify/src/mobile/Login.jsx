import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import './Auth.css';
 
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginAsGuest, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) navigate(from, { replace: true });
  };
 
  const handleGuest = async () => {
    const result = await loginAsGuest();
    if (result.success) navigate(from, { replace: true });
  };
 
  return (
    <div className="auth">
      <form className="auth__form" onSubmit={handleSubmit}>
        <h2 className="auth__title">Вход</h2>
 
        <div className="auth__field">
          <input
            className="auth__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
 
        <div className="auth__field">
          <input
            className="auth__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            required
          />
        </div>
 
        <button type="submit" className="auth__btn auth__btn--primary" disabled={loading}>
          {loading ? 'Загрузка...' : 'Войти'}
        </button>
 
        <button
          type="button"
          className="auth__btn auth__btn--secondary"
          onClick={handleGuest}
          disabled={loading}
        >
          Войти как гость
        </button>
 
        {error && <p className="auth__error">{error}</p>}
 
        <div className="auth__links">
          <Link to="/register" className="auth__link">
            Нет аккаунта? Зарегистрироваться
          </Link>
        </div>
      </form>
    </div>
  );
}
 