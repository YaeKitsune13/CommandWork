// src/api/client.js
const API_URL = 'http://127.0.0.1:5000/api';

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
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
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) throw new ApiError(json?.message || res.statusText, json?.code, res.status);

  if (json && typeof json === 'object' && 'code' in json) {
    if (json.code !== 'OK') throw new ApiError(json.message || 'API error', json.code, res.status);
    return json.result;
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