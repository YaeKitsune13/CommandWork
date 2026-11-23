import { request } from './client';

export const albumApi = {
  getAll: async (search) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await request(`/albums${query}`);
    return Array.isArray(data) ? data : (data?.items || []);
  },
  
  get: async (id) => {
    return await request(`/albums/${id}`);
  },
};