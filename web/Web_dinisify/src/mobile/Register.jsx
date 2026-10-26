import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../shared/hooks/register';
import { useAuth } from '../shared/hooks/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const { register, loading, error } = useRegister();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(email, password, nickname || null);
    if (!res.success) return;
    const loginRes = await login(email, password);
    if (loginRes.success) navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Никнейм (необязательно)"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/login">Уже есть аккаунт? Войти</Link>
        <Link to="/">Продолжить как гость</Link>
      </div>
    </form>
  );
}