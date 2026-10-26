import { useState } from 'react';
import { complaintApi } from '../api/complaintApi';
import { useAuth } from '../hooks/auth';
import './ReportButton.css';

export default function ReportButton({ targetType, targetId, label = 'Пожаловаться' }) {
  const { isGuest, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (isGuest || !token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await complaintApi.create(targetType, targetId, reason.trim());
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setReason('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="report-btn" onClick={() => setIsOpen(true)}>
        {label}
      </button>

      {isOpen && (
        <div className="report-modal-overlay" onClick={() => !loading && setIsOpen(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Оставить жалобу</h3>
            
            {success ? (
              <p className="report-modal__success">Жалоба отправлена</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="report-modal__target">
                  На: {targetType === 'Track' ? 'Трек' : 'Пользователя'} #{targetId}
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Опишите причину жалобы..."
                  rows={4}
                  disabled={loading}
                  required
                />
                
                {error && <p className="report-modal__error">{error}</p>}
                
                <div className="report-modal__actions">
                  <button type="button" onClick={() => setIsOpen(false)} disabled={loading}>
                    Отмена
                  </button>
                  <button type="submit" disabled={loading || !reason.trim()}>
                    {loading ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}