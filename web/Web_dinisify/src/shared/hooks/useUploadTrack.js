import { useState } from 'react';
import { trackApi } from '../api/trackApi';

export function useUploadTrack() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async ({ audioFile, name, albumId, image, genreIds }) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const fd = new FormData();
      
      // ВАЖНО: Имена полей должны строго совпадать с C# DTO (с учетом регистра)
      fd.append('Name', name);
      fd.append('AudioFile', audioFile);
      
      // Бэкенд ASP.NET Core может ожидать пустую строку, если AlbumId нет,
      // чтобы не было ошибок привязки nullable int
      if (albumId) {
        fd.append('AlbumId', String(albumId));
      } else {
        fd.append('AlbumId', ''); 
      }

      if (image) {
        fd.append('Image', image);
      }

      // Если на UI есть выбор жанров, обязательно передаем их
      if (genreIds && genreIds.length > 0) {
        genreIds.forEach(id => fd.append('GenreIds', String(id)));
      }

      const result = await trackApi.upload(fd, setProgress);
      return { success: true, track: result };
      
    } catch (err) {
      // Вытаскиваем сообщение об ошибке из ответа бэкенда (формат из твоей спеки)
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { upload, progress, loading, error };
}