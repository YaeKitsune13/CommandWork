import { request } from './client';

export const userApi = {
  getProfile: (id) => request(`/api/users/${id}`),
  getFollowers: (id) => request(`/api/users/${id}/followers`),
  getFollowing: (id) => request(`/api/users/${id}/following`),
  follow: (id) => request(`/api/users/${id}/follow`, { method: 'POST' }),
  unfollow: (id) => request(`/api/users/${id}/follow`, { method: 'DELETE' }),
  updateProfile: (id, data) =>
    request(`/api/users/${id}`, {
      method: 'PUT',
      body: data,
    }),
};