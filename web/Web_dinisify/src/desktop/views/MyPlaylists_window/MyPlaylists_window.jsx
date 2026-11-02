import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './MyPlaylists_window.css';

function MyPlaylists_window() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="my-playlists">
      <div className="my-playlists__header">
        <h1>Мои плейлисты</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Создать плейлист
        </button>
      </div>

      <div className="playlist-grid">
        {/* Dummy Playlist */}
        <div className="playlist-card">
          <div className="playlist-card__cover" />
          <h3>Chill Vibes</h3>
          <p>12 треков</p>
        </div>
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Новый плейлист</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <input type="text" placeholder="Название плейлиста" required />
              <textarea placeholder="Описание (необязательно)" rows="3"></textarea>
              <button type="submit" className="btn-primary">Создать</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MyPlaylists_window;