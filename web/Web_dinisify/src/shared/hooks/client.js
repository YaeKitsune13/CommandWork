const API_URL = 'http://127.0.0.1:5000/api';

export class ApiError extends Error {
  constructor(message, code, status, fields) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields || {};
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (auth) {
    const t = localStorage.getItem('token');
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  
  if (res.status === 401) {
    if (auth) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError('Сессия истекла — войдите снова', 'unauthorized', 401);
    } else {
      throw new ApiError('Неверный email или пароль', 'unauthorized', 401);
    }
  }

  const text = await res.text();
  let json = null;
  
  // Безопасный парсинг (защита от пустого тела)
  if (text && text.trim().length > 0) {
    try { json = JSON.parse(text); } catch { }
  }

  if (!res.ok) {
    let errMsg = json?.error || json?.message || json?.title || res.statusText;
    let errCode = json?.code || 'error';
    let fields = json?.fields;

    if (json?.errors) {
      fields = json.errors;
      const firstField = Object.keys(json.errors)[0];
      if (firstField && json.errors[firstField].length > 0) {
        errMsg = json.errors[firstField][0];
      }
    }

    throw new ApiError(errMsg, errCode, res.status, fields);
  }

  return json;
}

export const api = {
  get:   (p, o) => apiFetch(p, { ...o, method: 'GET' }),
  post:  (p, b, o) => apiFetch(p, { ...o, method: 'POST', body: b }),
  put:   (p, b, o) => apiFetch(p, { ...o, method: 'PUT', body: b }),
  patch: (p, b, o) => apiFetch(p, { ...o, method: 'PATCH', body: b }),
  del:   (p, o) => apiFetch(p, { ...o, method: 'DELETE' }),
};