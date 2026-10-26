import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTrackMeta } from '../../shared/hooks/useTrackMeta';
import { usePlayer } from '../../shared/player/PlayerContext';
import { getImageUrl } from '../../shared/utils/imageUrl';
import ReportButton from '../../shared/components/ReportButton';
import './TrackPage.css';

export default function TrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { track, loading, error } = useTrackMeta(id);
  const { playTrack, current, isPlaying, toggle } = usePlayer();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (loading) return <p className="track-page__hint">Загрузка...</p>;
  
  if (error) return (
    <div className="track-page">
      <button onClick={goBack} className="track-page__back">← Назад</button>
      <p className="track-page__error">{error}</p>
    </div>
  );
  
  if (!track) return null;

  const coverUrl = getImageUrl(track.image);
  const isCurrent = current?.id === track.id;
  
  const statusLabel = {
    approved: 'Одобрен',
    pending: 'На модерации',
    rejected: 'Отклонён',
  }[track.status] ?? track.status;

  const handlePlay = () => {
    if (isCurrent) toggle();
    else playTrack(track);
  };

  return (
    <div className="track-page">
      <button onClick={goBack} className="track-page__back">← Назад</button>

      <header className="track-page__header">
        <div className="track-page__cover">
          {coverUrl ? (
            <img src={coverUrl} alt={track.name} />
          ) : (
            <div className="track-page__cover-placeholder">♪</div>
          )}
        </div>

        <div className="track-page__meta">
          <h1>{track.name}</h1>
          <p className="track-page__artist">Артист #{track.artistId}</p>

          {track.albumId && (
            <Link to={`/albums/${track.albumId}`} className="track-page__album-link">
              Перейти к альбому →
            </Link>
          )}

          <div className="track-page__badges">
            <span className={`track-page__badge track-page__badge--${track.status}`}>
              {statusLabel}
            </span>
            {track.durationSec != null && (
              <span className="track-page__badge">{formatTime(track.durationSec)}</span>
            )}
          </div>

          {track.rejectionReason && (
            <p className="track-page__rejection">Причина: {track.rejectionReason}</p>
          )}
        </div>
      </header>

      <button className="track-page__play" onClick={handlePlay}>
        {isCurrent && isPlaying ? '⏸ Пауза' : '▶ Слушать'}
      </button>

      <dl className="track-page__details">
        <dt>Дата загрузки</dt>
        <dd>{new Date(track.createdAt).toLocaleDateString('ru-RU')}</dd>

        {track.ownerId && (
          <>
            <dt>Владелец</dt>
            <dd>
              <Link to={`/users/${track.ownerId}`} className="track-page__owner-link">
                Пользователь #{track.ownerId}
              </Link>
            </dd>
          </>
        )}

        {track.fileUrl && (
          <>
            <dt>Файл</dt>
            <dd className="track-page__file">{track.fileUrl}</dd>
          </>
        )}
      </dl>

      <div style={{ marginTop: '24px' }}>
        <ReportButton targetType="Track" targetId={track.id} label="Пожаловаться на трек" />
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}