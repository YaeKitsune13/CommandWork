import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../shared/hooks/register';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  const { register, loading, error, fieldErrors } = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API требует nickname, передаем его
    const res = await register(email, password, nickname);
    
    if (res.success) {
      // Токен уже сохранен в localStorage внутри useRegister!
      navigate('/'); 
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        {fieldErrors?.email && <span style={{ color: 'red', fontSize: '12px' }}>{fieldErrors.email[0]}</span>}
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          required
          minLength={6} // Из спецификации (пароль 123456)
        />
        {fieldErrors?.password && <span style={{ color: 'red', fontSize: '12px' }}>{fieldErrors.password[0]}</span>}
      </div>

      <div>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Никнейм"
          required // Теперь он обязателен!
        />
        {fieldErrors?.nickname && <span style={{ color: 'red', fontSize: '12px' }}>{fieldErrors.nickname[0]}</span>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/login">Уже есть аккаунт? Войти</Link>
        <Link to="/">Продолжить как гость</Link>
      </div>
    </form>
  );
}