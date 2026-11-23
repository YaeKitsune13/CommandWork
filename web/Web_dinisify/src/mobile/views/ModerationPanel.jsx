import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { moderatorApi } from '../../shared/api/moderatorApi';
import './ModerationPanel.css';

export default function ModerationPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tracks'); 

  const [tracks, setTracks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintFilter, setComplaintFilter] = useState('pending');
  const [analytics, setAnalytics] = useState(null);
  const [counts, setCounts] = useState({ pendingTracks: 0, pendingComplaints: 0 });
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCounts = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.allSettled([
        moderatorApi.getPendingTracks(1, 1),
        moderatorApi.getComplaints('pending', 1, 1),
      ]);
      setCounts({
        pendingTracks: tRes.status === 'fulfilled' ? (tRes.value?.total ?? tRes.value?.items?.length ?? 0) : 0,
        pendingComplaints: cRes.status === 'fulfilled' ? (cRes.value?.total ?? cRes.value?.items?.length ?? 0) : 0,
      });
    } catch {
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'tracks') {
        const data = await moderatorApi.getPendingTracks(1, 20);
        setTracks(data?.items || []);
      } else if (activeTab === 'complaints') {
        const data = await moderatorApi.getComplaints(complaintFilter, 1, 20);
        setComplaints(data?.items || []);
      }
      else if (activeTab === 'catalog') {
        const data = await moderatorApi.searchCatalogTracks(catalogSearch, 1, 20);
        setCatalogTracks(data?.items || []);
      }
      else if (activeTab === 'stats') {
        try {
          const stats = await moderatorApi.getAnalytics();
          setAnalytics(stats);
        } catch {
          setAnalytics(null);
        }
      }
      await loadCounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, complaintFilter, loadCounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleBlockTrack = async (id) => {
    const reason = window.prompt('Укажите причину блокировки трека:');
    if (!reason || !reason.trim()) return;
    try {
      await moderatorApi.reviewTrack(id, 'rejected', reason.trim());
      loadData();
    } catch (err) {
      alert('Ошибка блокировки: ' + err.message);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Одобрить этот трек?')) return;
    try {
      await moderatorApi.reviewTrack(id, 'approved', null);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Укажите причину отклонения:');
    if (!reason || !reason.trim()) return;
    try {
      await moderatorApi.reviewTrack(id, 'rejected', reason.trim());
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleEditTrack = async (track) => {
    const nextName = window.prompt('Новое название трека:', track.name);
    if (!nextName || !nextName.trim() || nextName.trim() === track.name) return;
    try {
      await moderatorApi.updateTrack(track.id, {
        name: nextName.trim(),
        albumId: track.album?.id ?? null,
        genreIds: Array.isArray(track.genres) ? track.genres.map((g) => g.id) : [],
      });
      loadData();
    } catch (err) {
      alert('Не удалось отредактировать трек: ' + err.message);
    }
  };

  const handleDeleteTrack = async (id) => {
    if (!window.confirm('Удалить трек как некорректный контент?')) return;
    try {
      await moderatorApi.deleteTrack(id);
      loadData();
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleResolveComplaint = async (id) => {
    if (!window.confirm('Пометить жалобу как решённую?')) return;
    try {
      await moderatorApi.resolveComplaint(id);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDeleteComplaintTarget = async (complaint) => {
    if (!window.confirm(`Удалить ${complaint.targetType} #${complaint.targetId}?`)) return;
    try {
      if (complaint.targetType === 'track') {
        await moderatorApi.deleteTrack(complaint.targetId);
      } else if (complaint.targetType === 'comment') {
        await moderatorApi.deleteComment(complaint.targetId);
      } else {
        alert('Для этого типа цели удаление через этот эндпоинт не поддерживается');
        return;
      }
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleToggleBlockUser = async (userId, isBlocked) => {
    const actionText = isBlocked ? 'разблокировать' : 'заблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${actionText} пользователя #${userId}?`)) return;
    try {
      await moderatorApi.setUserBlocked(userId, !isBlocked);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div className="mod-panel">
      <div className="mod-panel__top">
        <button onClick={() => navigate(-1)} className="mod-panel__back">Назад</button>
        <Link to="/upload" className="mod-panel__add-btn">+ Добавить трек</Link>
      </div>

      <header className="mod-panel__header">
        <h1>Панель модератора</h1>
      </header>

      <div className="mod-panel__tabs">
        <button
          className={activeTab === 'tracks' ? 'active' : ''}
          onClick={() => setActiveTab('tracks')}
        >
          Треки ({counts.pendingTracks})
        </button>
        <button
          className={activeTab === 'complaints' ? 'active' : ''}
          onClick={() => setActiveTab('complaints')}
        >
          Жалобы ({counts.pendingComplaints})
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
        <button
          className={activeTab === 'catalog' ? 'active' : ''}
          onClick={() => setActiveTab('catalog')}>
          Каталог
        </button>
      </div>

      {loading && <p className="mod-panel__hint">Загрузка...</p>}
      {error && <p className="mod-panel__error">{error}</p>}

      {!loading && activeTab === 'tracks' && (
        <div className="mod-panel__list">
          {tracks.length === 0 && <p className="mod-panel__hint">Нет треков для модерации</p>}
          {tracks.map((t) => (
            <div key={t.id} className="mod-card">
              <div className="mod-card__info">
                <strong>{t.name}</strong>
                <span>
                  ID: {t.id} | Автор: {t.owner?.nickname || `#${t.owner?.id}`} | Статус: {t.status}
                </span>
                {t.genres?.length > 0 && (
                  <span>Жанры: {t.genres.map((g) => g.name).join(', ')}</span>
                )}
                {t.streamUrl && (
                  <audio controls src={t.streamUrl} style={{ marginTop: '8px', width: '100%' }} />
                )}
              </div>
              <div className="mod-card__actions">
                <button className="btn-approve" onClick={() => handleApprove(t.id)}>Одобрить</button>
                <button className="btn-reject" onClick={() => handleReject(t.id)}>Отклонить</button>
                <button className="btn-secondary" onClick={() => handleEditTrack(t)}>Редактировать</button>
                <button className="btn-delete" onClick={() => handleDeleteTrack(t.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && activeTab === 'catalog' && (
        <div className="mod-panel__list">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadData();
            }}
            style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
          >
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Поиск опубликованных треков..."
              style={{ flex: 1 }}
            />
            <button type="submit">Найти</button>
          </form>

          {catalogTracks.length === 0 && <p className="mod-panel__hint">Треки не найдены</p>}
          {catalogTracks.map((t) => (
            <div key={t.id} className="mod-card">
              <div className="mod-card__info">
                <strong>{t.name}</strong>
                <span>
                  ID: {t.id} | Автор: {t.owner?.nickname || `#${t.owner?.id}`}
                </span>
                {t.streamUrl && (
                  <audio controls src={t.streamUrl} style={{ marginTop: '8px', width: '100%' }} />
                )}
              </div>
              <div className="mod-card__actions">
                <button className="btn-reject" onClick={() => handleBlockTrack(t.id)}>
                  Заблокировать
                </button>
                <button className="btn-delete" onClick={() => handleDeleteTrack(t.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'complaints' && (
        <div className="mod-panel__list">
          <div className="mod-panel__filters">
            <select value={complaintFilter} onChange={(e) => setComplaintFilter(e.target.value)}>
              <option value="pending">Ожидают решения</option>
              <option value="resolved">Решённые</option>
            </select>
          </div>

          {complaints.length === 0 && <p className="mod-panel__hint">Жалоб не найдено</p>}
          {complaints.map((c) => (
            <div key={c.id} className="mod-card">
              <div className="mod-card__info">
                <strong>Жалоба #{c.id}</strong>
                <span>Цель: {c.targetType} #{c.targetId}</span>
                <span>От: {c.reporter?.nickname || `Пользователь #${c.reporterId}`}</span>
                <span className="mod-card__reason">Причина: «{c.reason}»</span>
                {c.description && <span>Описание: {c.description}</span>}
              </div>
              <div className="mod-card__actions">
                {(c.status === 'pending' || c.status === 0) && (
                  <button className="btn-approve" onClick={() => handleResolveComplaint(c.id)}>
                    Решено
                  </button>
                )}
                {(c.targetType === 'track' || c.targetType === 'comment') && (
                  <button className="btn-delete" onClick={() => handleDeleteComplaintTarget(c)}>
                    Удалить {c.targetType === 'track' ? 'трек' : 'коммент'}
                  </button>
                )}
                {c.targetType === 'user' && (
                  <button className="btn-reject" onClick={() => handleToggleBlockUser(c.targetId, false)}>
                    Заблокировать #{c.targetId}
                  </button>
                )}
                <span className="mod-card__status">Статус: {c.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'stats' && (
        <div className="mod-panel__stats">
          <div className="mod-card">
            <div className="mod-card__info">
              <strong>Текущие очереди модерации</strong>
              <span>Треков на проверке: {counts.pendingTracks}</span>
              <span>Активных жалоб: {counts.pendingComplaints}</span>
            </div>
          </div>

          {analytics ? (
            <div className="mod-card">
              <div className="mod-card__info">
                <strong>Сводка платформы (/admin/analytics)</strong>
                <pre>{JSON.stringify(analytics, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p className="mod-panel__hint">
              Общая аналитика платформы в API v1 доступна роли Admin; модератору показаны счётчики очередей.
            </p>
          )}
        </div>
      )}
    </div>
  );
}