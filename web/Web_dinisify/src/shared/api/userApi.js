import { request } from './client';

export const userApi = {
  getProfile: (id) => request(`/users/${id}`),
  getFollowers: (id) => request(`/users/${id}/followers`),
  getFollowing: (id) => request(`/users/${id}/following`),
  follow: (id) => request(`/users/${id}/follow`, { method: 'POST' }),
  unfollow: (id) => request(`/users/${id}/follow`, { method: 'DELETE' }),
  updateProfile: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: data,
    }),
};