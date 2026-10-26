import { useState, useCallback } from 'react';
import { authApi } from '../api/authApi';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getRoleFromToken(token) {
  const payload = parseJwt(token);
  if (!payload) return 'user';
  
  const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  return roleClaim || payload.role || 'user';
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  const [role, setRole] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      const realRole = getRoleFromToken(savedToken);
      localStorage.setItem('role', realRole);
      return realRole;
    }
    return 'guest';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persist = useCallback((newToken, newRole) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      const newToken = data?.token ?? data?.access_token ?? data;
      if (!newToken) throw new Error('Токен не получен от сервера');
      
      const actualRole = getRoleFromToken(newToken);
      persist(newToken, actualRole);
      
      return { success: true };
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
      const data = await authApi.guest();
      const newToken = data?.token ?? data?.access_token ?? data;
      if (!newToken) throw new Error('Гостевой токен не получен');
      persist(newToken, 'guest');
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole('guest');
  };

  return {
    token,
    role,
    isGuest: role === 'guest',
    isAuthenticated: !!token,
    login,
    loginAsGuest,
    logout,
    loading,
    error,
  };
}