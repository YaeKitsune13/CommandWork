import { request } from './client';

export const authApi = {
  register: (email, password, nickname = null) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { email, password, nickname },
      auth: false,
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  guest: () =>
    request('/api/auth/guest', {
      method: 'POST',
      auth: false,
    }),

  me: () => request('/api/auth/me'),
};