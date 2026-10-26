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
function getIdFromToken(token) {
  const payload = parseJwt(token);
  if (!payload) return null;
  return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
      || payload.nameid 
      || payload.sub 
      || null;
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? getRoleFromToken(savedToken) : 'guest';
  });
  const [userId, setUserId] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? getIdFromToken(savedToken) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persist = useCallback((newToken) => {
    const actualRole = getRoleFromToken(newToken);
    const actualId = getIdFromToken(newToken);
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', actualRole);
    
    setToken(newToken);
    setRole(actualRole);
    setUserId(actualId);
  }, []);
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      const newToken = data?.token ?? data?.access_token ?? data;
      if (!newToken) throw new Error('Токен не получен от сервера');
      
      persist(newToken); 
      
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
      if (!newToken) throw new Error('токен не получен');
      
      persist(newToken);
      
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
    setUserId(null);
  };

  return {
    token,
    role,
    userId,
    isGuest: role === 'guest',
    isAuthenticated: !!token,
    login,
    logout,
    loading,
    error,
  };
}