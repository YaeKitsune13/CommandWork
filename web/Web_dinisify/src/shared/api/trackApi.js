import { request, API_URL } from './client';

export const trackApi = {
  // В спецификации (v1) старый роут /api/music/meta заменен на /api/tracks/{id}
  meta: (id) => request(`/tracks/${id}`),

  /**
   * Загрузка трека с прогрессом.
   * @param {FormData} formData 
   * @param {(percent:number)=>void} onProgress
   * @returns {Promise<{id:number, ...}>}
   */
  upload: (formData, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // ИСПОЛЬЗУЕМ API_URL и правильный путь /tracks
      // Если API_URL = '/api', итоговый путь будет '/api/tracks'
      xhr.open('POST', `${API_URL}/tracks`);

      const token = localStorage.getItem('token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data?.music ?? data);
        } else {
          // Обработка ошибок в стиле ASP.NET Core
          let message = data?.error || data?.title || `Ошибка ${xhr.status}`;
          if (data?.fields) {
            const first = Object.values(data.fields).flat()[0];
            if (first) message = first;
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error('Сетевая ошибка при загрузке'));
      xhr.send(formData);
    }),
};