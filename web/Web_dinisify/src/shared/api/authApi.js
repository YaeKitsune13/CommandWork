// api/authApi.js
import { request } from './client';

export const authApi = {
  register: (email, password, nickname, phone = null) =>
    request('/auth/register', {
      method: 'POST',
      body: { email, password, nickname, phone },
      auth: false,
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  guest: () =>
    request('/auth/guest', {
      method: 'POST',
      auth: false,
    }),

  me: () => request('/auth/me'),
};