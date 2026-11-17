// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://127.0.0.1:5000/api';
const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

export function useAuth() {
  // --- 1. ОБЪЯВЛЕНИЕ ПЕРЕМЕННЫХ (здесь была ваша ошибка) ---
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState(
    () => localStorage.getItem(ROLE_KEY) || (localStorage.getItem(TOKEN_KEY) ? 'user' : 'guest')
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async (tk) => {
    const t = tk || token;
    if (!t) return null;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      setUser(data);
      const r = data.role || 'user';
      setRole(r);
      localStorage.setItem(ROLE_KEY, r);
      return data;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchMe(token);
  }, [token, fetchMe]); // Добавили зависимости, чтобы избежать багов

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Неверный email или пароль');

      const data = await response.json();
      const newToken = data.token; // Бэкенд отдает { "token": "..." }
      
      if (!newToken) throw new Error('Токен не получен от сервера');

      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);

      const me = await fetchMe(newToken);
      const newRole = me?.role || 'user';
      setRole(newRole);
      localStorage.setItem(ROLE_KEY, newRole);

      return { success: true, role: newRole };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/guest`, { method: 'POST' });
      if (!res.ok) throw new Error('Не удалось войти как гость');
      
      const data = await res.json();
      const newToken = data?.token || data; // Бэкенд может вернуть строку или объект
      if (!newToken) throw new Error('Токен не получен');

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(ROLE_KEY, 'guest');
      setToken(newToken);
      setRole('guest');
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, nickname) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }), // Добавили nickname по спецификации
      });
      if (res.status === 409) throw new Error('Email или никнейм уже занят');
      if (!res.ok) throw new Error('Не удалось зарегистрироваться');
      
      const data = await res.json();
      const newToken = data.token;
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setRole('guest');
    setUser(null);
  };

  return {
    token,
    role,
    user,
    isAuthenticated: !!token, // <--- ТЕПЕРЬ ЗДЕСЬ ЕСТЬ
    isGuest: role === 'guest' || !token,
    isModerator: role === 'moderator' || role === 'admin',
    isAdmin: role === 'admin',
    login,
    loginAsGuest,
    register,
    logout,
    fetchMe,
    loading,
    error,
  };
}