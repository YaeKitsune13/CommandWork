import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadTrack } from '../../shared/hooks/useUploadTrack';
import { useParams, Link } from 'react-router-dom';
import './UploadTrack.css';

export default function UploadTrack() {
  const navigate = useNavigate();
  const { upload, progress, loading, error } = useUploadTrack();

  const [name, setName] = useState('');
  const [artistId, setArtistId] = useState('1');
  const [ownerId, setOwnerId] = useState('10');
  const [albumId, setAlbumId] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      alert('Выберите аудиофайл');
      return;
    }

    const res = await upload({
      audioFile,
      name,
      artistId: Number(artistId),
      ownerId: Number(ownerId),
      albumId: albumId ? Number(albumId) : null,
      image,
    });

    if (res.success) {
      alert('Трек отправлен на модерацию');
      navigate(`/tracks/${res.track.id}`);
    }
  };

  return (
    <form className="upload" onSubmit={handleSubmit}>
      <h1>Загрузить трек</h1>
        <Link to="/home">(-- Назад к поиску</Link>

      <label className="upload__field">
        <span>Название *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </label>

      <label className="upload__field">
        <span>Аудиофайл (mp3 / wav / ogg / flac) *</span>
        <input
          type="file"
          accept=".mp3,.wav,.ogg,.flac"
          onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          required
        />
      </label>

      <label className="upload__field">
        <span>Обложка (jpg / png / webp, необязательно)</span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="upload__row">
        <label className="upload__field">
          <span>ArtistId *</span>
          <input
            type="number"
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            required
          />
        </label>

        <label className="upload__field">
          <span>OwnerId *</span>
          <input
            type="number"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            required
          />
        </label>

        <label className="upload__field">
          <span>AlbumId (опционально)</span>
          <input
            type="number"
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
          />
        </label>
      </div>

      <p className="upload__note">
        Этого пока нету из-за вонючего бэк'а
      </p>

      {loading && (
        <div className="upload__progress">
          <div className="upload__progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}

      {error && <p className="upload__error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </form>
  );
}