import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || (localStorage.getItem('token') ? 'user' : 'guest');
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Неверный email или пароль');
      }

      const textData = await response.text();
      let newToken = textData;
      
      try {
        const jsonData = JSON.parse(textData);
        if (jsonData.token) newToken = jsonData.token;
        else if (jsonData.access_token) newToken = jsonData.access_token;
      } catch (e) {
        newToken = textData;
      }

      if (!newToken) throw new Error('Токен не получен от сервера');

      localStorage.setItem('token', newToken);
      localStorage.setItem('role', 'user'); 

      setToken(newToken);
      setRole('user');

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
    isGuest: role === 'guest' || !token,
    login,
    logout,
    loading,
    error,
  };
}