import { request } from './client';

export const albumApi = {
  getAll: (search) =>
    request(`/api/albums${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  get: (id) => request(`/api/albums/${id}`),
};