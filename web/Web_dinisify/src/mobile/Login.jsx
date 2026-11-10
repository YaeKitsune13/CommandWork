import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/auth';

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
    <form onSubmit={handleSubmit}>
      <h2>Вход</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Загрузка...' : 'Войти'}
      </button>

      <button type="button" onClick={handleGuest} disabled={loading}>
        Войти как гость
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
      </div>
    </form>
  );
}