import { request } from './client';

export const discoveryApi = {
  // GET /api/charts?period=week&genreId=&limit=50 → ChartItemDto[]
  charts: ({ period = 'week', genreId = null, limit = 50 } = {}) => {
    const params = new URLSearchParams({ period, limit: String(limit) });
    if (genreId != null) params.set('genreId', String(genreId));
    return request(`/api/charts?${params.toString()}`);
  },

  // GET /api/recommendations?limit=20 → TrackSearchDto[]
  recommendations: (limit = 20) =>
    request(`/api/recommendations?limit=${limit}`),

  // GET /api/search?query=... → SearchResultDto
  search: (query) =>
    request(`/api/search?query=${encodeURIComponent(query)}`),
};