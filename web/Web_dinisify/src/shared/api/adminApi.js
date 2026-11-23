import { request } from './client';

export const adminApi = {
  getAnalytics: () => request('/admin/analytics'),

  getUsers: (search = '', page = 1, pageSize = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search.trim()) params.append('search', search.trim());
    return request(`/admin/users?${params.toString()}`);
  },

  changeUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),

  setUserBlocked: (id, isBlocked) =>
    request(`/admin/users/${id}/block`, {
      method: 'PATCH',
      body: { isBlocked },
    }),

  getGenres: () => request('/genres'),

  createGenre: (name) =>
    request('/admin/genres', {
      method: 'POST',
      body: { name },
    }),

  updateGenre: (id, name) =>
    request(`/admin/genres/${id}`, {
      method: 'PUT',
      body: { name },
    }),

  deleteGenre: (id) =>
    request(`/admin/genres/${id}`, {
      method: 'DELETE',
    }),
};