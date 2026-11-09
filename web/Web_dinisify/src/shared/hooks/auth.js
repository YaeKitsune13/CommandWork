import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://127.0.0.1:5000/api';
const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const NICKNAME_KEY = 'dinisify_nickname';

// Явный именованный экспорт useAuth
export function useAuth() {
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

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(NICKNAME_KEY);
        setToken(null);
        setRole('guest');
        setUser(null);
        return null;
      }
      if (!res.ok) return null;

      const data = await res.json();
      
      // Подменяем имя из JWT на локально сохраненное (если меняли профиль)
      const storedName = localStorage.getItem(NICKNAME_KEY);
      if (storedName && data) {
        data.name = storedName;
      }

      setUser(data);
      setRole(data.role || 'user');
      return data;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => { 
    if (token) fetchMe(token); 
  }, [token, fetchMe]);

  const setLocalName = (name) => {
    if (!name) return;
    localStorage.setItem(NICKNAME_KEY, name);
    setUser(prev => (prev ? { ...prev, name } : prev));
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Неверный email или пароль');
      }

      // Бэкенд может вернуть токен как строку или как { token: "..." }
      let newToken = typeof data === 'string' ? data : (data.token || data.access_token);
      if (!newToken) throw new Error('Токен не получен');

      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      
      await fetchMe(newToken);
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
        body: JSON.stringify({ email, password, nickname }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Обрабатываем ошибки валидации ASP.NET Core
        const msg = data?.errors?.Nickname?.[0] 
                 || data?.errors?.Email?.[0] 
                 || data?.error 
                 || 'Не удалось зарегистрироваться';
        throw new Error(msg);
      }

      setLocalName(nickname);
      return await login(email, password);
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
    localStorage.removeItem(NICKNAME_KEY);
    setToken(null);
    setRole('guest');
    setUser(null);
  };

  return {
    token, 
    role, 
    user, 
    isGuest: role === 'guest' || !token, 
    isModerator: role === 'moderator' || role === 'admin',
    isAdmin: role === 'admin',
    login, 
    register, 
    logout, 
    fetchMe, 
    setLocalName, 
    loading, 
    error
  };
}