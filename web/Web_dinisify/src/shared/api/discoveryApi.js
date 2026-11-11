import { request } from './client';

export const discoveryApi = {
  // Убрали /api из путей, так как client.js уже добавляет его
  charts: ({ period = 'week', genreId = null, limit = 50 } = {}) => {
    const params = new URLSearchParams({ period, limit: String(limit) });
    if (genreId != null) params.set('genreId', String(genreId));
    return request(`/charts?${params.toString()}`);
  },

  recommendations: (limit = 20) =>
    request(`/recommendations?limit=${limit}`),

  search: (query) =>
    request(`/search?query=${encodeURIComponent(query)}`),
};