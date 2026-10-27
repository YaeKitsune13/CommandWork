import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import './MyTracks_window.css';

function MyTracks_window() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="my-tracks">
      <div className="my-tracks__header">
        <h1>Мои треки</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Upload size={18} /> Загрузить трек
        </button>
      </div>

      <div className="my-tracks__list">
        {/* Dummy Track */}
        <div className="track-item">
          <div className="track-item__cover" />
          <div className="track-item__info">
            <span className="track-item__title">My First Track</span>
            <span className="track-item__status status--pending">На модерации</span>
          </div>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Загрузить трек</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <input type="text" placeholder="Название трека" required />
              <input type="text" placeholder="Жанр" />
              <div className="file-input">
                <label>Аудиофайл (mp3/wav)</label>
                <input type="file" accept="audio/*" required />
              </div>
              <button type="submit" className="btn-primary">Отправить на модерацию</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MyTracks_window;