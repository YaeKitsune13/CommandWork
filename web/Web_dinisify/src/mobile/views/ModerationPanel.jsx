import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moderatorApi } from '../../shared/api/moderatorApi';
import './ModerationPanel.css';

export default function ModerationPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('music');
  
  const [tracks, setTracks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'music') {
        const data = await moderatorApi.getPendingMusic();
        setTracks(data);
      } else {
        const data = await moderatorApi.getComplaints();
        setComplaints(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id) => {
    if (!window.confirm('Одобрить этот трек?')) return;
    try {
      await moderatorApi.reviewMusic(id, true);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Укажите причину отклонения:');
    if (!reason) return;
    try {
      await moderatorApi.reviewMusic(id, false, reason);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleResolveComplaint = async (id) => {
    if (!window.confirm('Пометить жалобу как решенную?')) return;
    try {
      await moderatorApi.resolveComplaint(id);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div className="mod-panel">
      <button onClick={() => navigate(-1)} className="mod-panel__back">Назад</button>
      
      <header className="mod-panel__header">
        <h1>Панель модератора</h1>
      </header>

      <div className="mod-panel__tabs">
        <button 
          className={activeTab === 'music' ? 'active' : ''} 
          onClick={() => setActiveTab('music')}
        >
          Треки на модерации
        </button>
        <button 
          className={activeTab === 'complaints' ? 'active' : ''} 
          onClick={() => setActiveTab('complaints')}
        >
          Жалобы
        </button>
      </div>

      {loading && <p className="mod-panel__hint">Загрузка...</p>}
      {error && <p className="mod-panel__error">{error}</p>}

      {!loading && activeTab === 'music' && (
        <div className="mod-panel__list">
          {tracks.length === 0 && <p className="mod-panel__hint">Нет треков длы модерации</p>}
          {tracks.map(t => (
            <div key={t.id} className="mod-card">
              <div className="mod-card__info">
                <strong>{t.name}</strong>
                <span>ID: {t.id} | Владелец: {t.ownerId}</span>
                <span className="mod-card__file">Файл: {t.fileUrl}</span>
              </div>
              <div className="mod-card__actions">
                <button className="btn-approve" onClick={() => handleApprove(t.id)}>Одобрить</button>
                <button className="btn-reject" onClick={() => handleReject(t.id)}>Отклонить</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && activeTab === 'complaints' && (
        <div className="mod-panel__list">
          {complaints.length === 0 && <p className="mod-panel__hint">Нет активных жалоб</p>}
          {complaints.map(c => (
            <div key={c.id} className="mod-card">
              <div className="mod-card__info">
                <strong>Жалоба #{c.id}</strong>
                <span>На: {c.targetType} #{c.targetId}</span>
                <span>От: Пользователь #{c.reporterId}</span>
                <span className="mod-card__reason">«{c.reason}»</span>
              </div>
              <div className="mod-card__actions">
                {c.status === 'pending' || c.status === 0 ? (
                  <button className="btn-approve" onClick={() => handleResolveComplaint(c.id)}>
                    Решено
                  </button>
                ) : (
                  <span className="mod-card__status">Статус: {c.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}