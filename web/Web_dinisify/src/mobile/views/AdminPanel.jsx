import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../shared/api/adminApi';
import './ModerationPanel.css';
 
export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [genres, setGenres] = useState([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadAnalytics = useCallback(async () => {
    const data = await adminApi.getAnalytics();
    setAnalytics(data);
  }, []);
  const loadUsers = useCallback(async (searchQuery = '') => {
    const data = await adminApi.getUsers(searchQuery, 1, 50);
    const list = Array.isArray(data) ? data : data?.items;
    setUsers(Array.isArray(list) ? list : []);
  }, []);
  const loadGenres = useCallback(async () => {
    const data = await adminApi.getGenres();
    const list = Array.isArray(data) ? data : data?.items;
    setGenres(Array.isArray(list) ? list : []);
  }, []);
  const loadTab = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'analytics') {
        await loadAnalytics();
      } else if (activeTab === 'users') {
        await loadUsers(userSearch);
      } else if (activeTab === 'genres') {
        await loadGenres();
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadAnalytics, loadUsers, loadGenres, userSearch]);
 
  useEffect(() => {
    loadTab();
  }, [activeTab]);
 
  const handleUserSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loadUsers(userSearch);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const handleRoleChange = async (user, nextRole) => {
    if (user.role === nextRole) return;
    if (!window.confirm(`Назначить пользователю ${user.nickname} роль «${nextRole}»?`)) return;
    try {
      await adminApi.changeUserRole(user.id, nextRole);
      await loadUsers(userSearch);
    } catch (err) {
      alert('Ошибка смены роли: ' + err.message);
    }
  };
 
  const handleToggleBlock = async (user) => {
    const nextBlocked = !user.isBlocked;
    const label = nextBlocked ? 'заблокировать' : 'разблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${label} ${user.nickname}?`)) return;
    try {
      await adminApi.setUserBlocked(user.id, nextBlocked);
      await loadUsers(userSearch);
    } catch (err) {
      alert('Ошибка блокировки: ' + err.message);
    }
  };
 
  const handleCreateGenre = async (e) => {
    e.preventDefault();
    const name = newGenreName.trim();
    if (!name) return;
    try {
      await adminApi.createGenre(name);
      setNewGenreName('');
      await loadGenres();
    } catch (err) {
      alert('Ошибка создания жанра: ' + err.message);
    }
  };
 
  const handleRenameGenre = async (genre) => {
    const nextName = window.prompt('Новое название жанра:', genre.name);
    if (!nextName || !nextName.trim() || nextName.trim() === genre.name) return;
    try {
      await adminApi.updateGenre(genre.id, nextName.trim());
      await loadGenres();
    } catch (err) {
      alert('Ошибка переименования: ' + err.message);
    }
  };
 
  const handleDeleteGenre = async (genre) => {
    if (!window.confirm(`Удалить жанр «${genre.name}»?`)) return;
    try {
      await adminApi.deleteGenre(genre.id);
      await loadGenres();
    } catch (err) {
      alert('Ошибка удаления жанра: ' + err.message);
    }
  };
 
  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter((u) => u.role === roleFilter);
 
  return (
    <div className="mod-panel">
      <div className="mod-panel__top">
        <button onClick={() => navigate(-1)} className="mod-panel__back">Назад</button>
        <Link to="/moderation" className="mod-panel__add-btn">Панель модерации</Link>
      </div>
 
      <header className="mod-panel__header">
        <h1>Панель администратора</h1>
      </header>
 
      <div className="mod-panel__tabs">
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Аналитика
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Пользователи и роли
        </button>
        <button
          className={activeTab === 'genres' ? 'active' : ''}
          onClick={() => setActiveTab('genres')}
        >
          Жанры
        </button>
      </div>
 
      {loading && <p className="mod-panel__hint">Загрузка...</p>}
      {error && <p className="mod-panel__error">{error}</p>}
 
      {!loading && activeTab === 'analytics' && analytics && (
        <div className="mod-panel__list">
          {typeof analytics === 'object' ? (
            Object.entries(analytics).map(([key, val]) => (
              <div key={key} className="mod-card">
                <div className="mod-card__info">
                  <strong>{key}</strong>
                  <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              </div>
            ))
          ) : (
            <pre className="mod-panel__pre">{String(analytics)}</pre>
          )}
        </div>
      )}
 
      {!loading && activeTab === 'users' && (
        <div className="mod-panel__list">
          <form className="mod-panel__search" onSubmit={handleUserSearchSubmit}>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Поиск по нику или email..."
            />
            <button type="submit" className="mod-panel__search-btn">Найти</button>
          </form>
 
          <div className="mod-panel__filters">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">Все роли</option>
              <option value="user">Пользователи (user)</option>
              <option value="moderator">Модераторы (moderator)</option>
              <option value="admin">Администраторы (admin)</option>
            </select>
          </div>
 
          {filteredUsers.length === 0 && <p className="mod-panel__hint">Пользователи не найдены</p>}
          {filteredUsers.map((u) => (
            <div key={u.id} className="mod-card">
              <div className="mod-card__info">
                <strong>{u.nickname} (ID: {u.id})</strong>
                <span>{u.email || 'Без email'}</span>
                <span>
                  Роль: <b>{u.role}</b> | Статус: {u.isBlocked ? 'Заблокирован' : 'Активен'}
                </span>
              </div>
              <div className="mod-card__actions">
                <select
                  className="mod-card__select"
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value)}
                  aria-label="Роль пользователя"
                >
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  className={u.isBlocked ? 'btn-approve' : 'btn-reject'}
                  onClick={() => handleToggleBlock(u)}
                >
                  {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {!loading && activeTab === 'genres' && (
        <div className="mod-panel__list">
          <form className="mod-panel__search" onSubmit={handleCreateGenre}>
            <input
              type="text"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder="Название нового жанра..."
              required
            />
            <button type="submit" className="btn-approve">+ Добавить</button>
          </form>
 
          {genres.length === 0 && <p className="mod-panel__hint">Жанров пока нет</p>}
          {genres.map((g) => (
            <div key={g.id} className="mod-card">
              <div className="mod-card__info">
                <strong>{g.name}</strong>
                <span>ID: {g.id}</span>
              </div>
              <div className="mod-card__actions">
                <button className="btn-secondary" onClick={() => handleRenameGenre(g)}>
                  Переименовать
                </button>
                <button className="btn-reject" onClick={() => handleDeleteGenre(g)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 