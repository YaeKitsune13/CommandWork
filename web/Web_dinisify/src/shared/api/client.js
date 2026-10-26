export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Читаем текст ответа (даже если он пустой)
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    // ✨ НОВОЕ: Если токен протух (401) — разлогиниваем
    if (response.status === 401 && auth && !path.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // Принудительно перезагружаем страницу, чтобы RequireAuth кинул на /login
      window.location.href = '/login';
    }

    let message = data;
    if (typeof message === 'string') {
      message = message.replace(/^"|"$/g, '');
    } else if (message && typeof message === 'object') {
      message = message.message || message.error || message.title || `Ошибка ${response.status}`;
    }
    throw new ApiError(message || `Ошибка ${response.status}`, response.status);
  }

  return data;
}