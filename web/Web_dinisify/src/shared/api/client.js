// api/client.js
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, fields = null) {
    super(message);
    this.status = status;
    this.fields = fields; // Сохраняем ошибки конкретных полей
  }
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Теперь пути будут склеиваться как /api + /auth/login = /api/auth/login
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && !path.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    let message = `Ошибка ${response.status}`;
    let fields = null;

    // Парсим ошибки по стандарту из вашей документации
    if (data && typeof data === 'object') {
      message = data.error || data.message || message;
      fields = data.fields || null;
    } else if (typeof data === 'string') {
      message = data;
    }

    throw new ApiError(message, response.status, fields);
  }

  return data;
}