import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/auth';
import { userApi } from '../../shared/api/userApi';
import './ProfileSettings.css';

export default function ProfileSettings() {
  const { userId, token } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ nickname: '', image: '', privacy: 'public' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userId) return;
    userApi.getProfile(userId)
      .then(data => {
        setForm({
          nickname: data.nickname || '',
          image: data.image || '',
          privacy: data.privacy || 'public'
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await userApi.updateProfile(userId, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return <p className="settings__hint">Войдите в аккаунт для настройки профиля</p>;
  if (loading) return <p className="settings__hint">Загрузка...</p>;

  return (
    <div className="settings">
      <button onClick={() => navigate(-1)} className="settings__back">← Назад</button>
      
      <h1>Настройки профиля</h1>

      <form onSubmit={handleSubmit} className="settings__form">
        <label className="settings__field">
          <span>Никнейм</span>
          <input 
            name="nickname" 
            value={form.nickname} 
            onChange={handleChange} 
            required 
            maxLength={50}
          />
        </label>

        <label className="settings__field">
          <span>Ссылка на аватарку (URL)</span>
          <input 
            name="image" 
            value={form.image} 
            onChange={handleChange} 
            placeholder="https://..." 
          />
        </label>

        <label className="settings__field">
          <span>Приватность профиля</span>
          <select name="privacy" value={form.privacy} onChange={handleChange}>
            <option value="public">Публичный</option>
            <option value="private">Приватный</option>
          </select>
        </label>

        {error && <p className="settings__error">{error}</p>}
        {success && <p className="settings__success">Профиль успешно обновлен!</p>}

        <button type="submit" className="settings__submit" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
}