import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../../shared/hooks/useProfile';
import { useFollow } from '../../shared/hooks/useFollow';
import { useAuth } from '../../shared/hooks/auth';
import ReportButton from '../../shared/components/ReportButton';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, followers, following, loading, error, reload } = useProfile(id);
  const { token, role } = useAuth();
  const { follow, unfollow, loading: followLoading, error: followError } = useFollow(reload);
  const [isFollowing, setIsFollowing] = useState(false);

  const canFollow = !!token && role !== 'guest';

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (loading) return <p className="profile__hint">Загрузка...</p>;
  if (error) {
    return (
      <div className="profile">
        <button onClick={goBack} className="profile__back">← Назад</button>
        <p className="profile__error">{error}</p>
      </div>
    );
  }
  if (!profile) return null;

  const handleFollow = async () => {
    const res = isFollowing ? await unfollow(profile.id) : await follow(profile.id);
    if (res.success) setIsFollowing((v) => !v);
  };

  const renderUserList = (users, empty) => {
    if (users.length === 0) return <p className="profile__empty">{empty}</p>;
    return (
      <ul className="profile__list">
        {users.map((u) => (
          <li key={u.id}>
            <Link to={`/users/${u.id}`} className="profile__user-link">
              {u.nickname ?? `Пользователь #${u.id}`}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="profile">
      <button onClick={goBack} className="profile__back">← Назад</button>

      <header className="profile__header">
        <div className="profile__avatar">
          {profile.image ? (
            <img src={profile.image} alt={profile.nickname} />
          ) : (
            <div className="profile__avatar-placeholder">
              {profile.nickname?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="profile__info">
          <h1>{profile.nickname}</h1>
          <div className="profile__badges">
            <span className={`profile__badge profile__badge--${profile.role}`}>
              {profile.role}
            </span>
            <span className="profile__badge">{profile.privacy}</span>
          </div>
          {profile.createdAt && (
            <p className="profile__since">
              На сайте с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      </header>

      <div className="profile__stats">
        <div className="profile__stat">
          <strong>{followers.length}</strong>
          <span>подписчиков</span>
        </div>
        <div className="profile__stat">
          <strong>{following.length}</strong>
          <span>подписок</span>
        </div>
      </div>

      {canFollow ? (
        <button
          className="profile__follow"
          onClick={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? '...' : isFollowing ? 'Отписаться' : 'Подписаться'}
        </button>
      ) : (
        <p className="profile__hint profile__hint--small">
          Войдите как пользователь
        </p>
      )}
      {followError && <p className="profile__error">{followError}</p>}

      <section className="profile__section">
        <h2>Подписчики</h2>
        {renderUserList(followers, 'Пока никто не подписан')}
      </section>

      <section className="profile__section">
        <h2>Подписки</h2>
        {renderUserList(following, 'Пока нет подписок')}
      </section>
    <div style={{ marginTop: '24px' }}>
         <ReportButton targetType="User" targetId={profile.id} label="Пожаловаться на пользователя" />
    </div>
    </div>
  );
}