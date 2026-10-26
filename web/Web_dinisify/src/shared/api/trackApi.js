import { request, API_URL } from './client';

export const trackApi = {
  meta: (id) => request(`/api/music/meta?id=${id}`),

  /**
   * Загрузка трека с прогрессом.
   * @param {FormData} formData — содержит AudioFile, Name, ArtistId, OwnerId, [AlbumId], [Image]
   * @param {(percent:number)=>void} onProgress
   * @returns {Promise<{id:number, ...}>}
   */
  upload: (formData, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/music`);

      const token = localStorage.getItem('token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* фывпку */ }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data?.music ?? data);
        } else {
          let message = data?.message || data?.title || `Ошибка ${xhr.status}`;
          if (data?.errors) {
            const first = Object.values(data.errors).flat()[0];
            if (first) message = first;
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error('Сетевая ошибка при загрузке'));
      xhr.send(formData);
    }),
};