import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../shared/hooks/register';
import './Auth.css';
 
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const { register, loading, error, fieldErrors } = useRegister();
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(email, password, nickname);
    if (res.success) {
      navigate('/');
    }
  };
 
  return (
    <div className="auth">
      <form className="auth__form" onSubmit={handleSubmit}>
        <h2 className="auth__title">Регистрация</h2>
 
        <div className="auth__field">
          <input
            className={`auth__input ${fieldErrors?.email ? 'auth__input--invalid' : ''}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          {fieldErrors?.email && (
            <span className="auth__field-error">{fieldErrors.email[0]}</span>
          )}
        </div>
 
        <div className="auth__field">
          <input
            className={`auth__input ${fieldErrors?.password ? 'auth__input--invalid' : ''}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            required
            minLength={6}
          />
          {fieldErrors?.password && (
            <span className="auth__field-error">{fieldErrors.password[0]}</span>
          )}
        </div>
 
        <div className="auth__field">
          <input
            className={`auth__input ${fieldErrors?.nickname ? 'auth__input--invalid' : ''}`}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Никнейм"
            required
          />
          {fieldErrors?.nickname && (
            <span className="auth__field-error">{fieldErrors.nickname[0]}</span>
          )}
        </div>
 
        <button type="submit" className="auth__btn auth__btn--primary" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
 
        {error && <p className="auth__error">{error}</p>}
 
        <div className="auth__links">
          <Link to="/login" className="auth__link">
            Уже есть аккаунт? Войти
          </Link>
          <Link to="/" className="auth__link">
            Продолжить как гость
          </Link>
        </div>
      </form>
    </div>
  );
}
 