import { useState } from 'react';
import { authApi } from '../api/authApi';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null); // Для ошибок полей (email занят и т.д.)

  const register = async (email, password, nickname) => {
    setLoading(true);
    setError(null);
    setFieldErrors(null);
    try {
      const data = await authApi.register(email, password, nickname);
      // Регистрация сразу возвращает токен!
      localStorage.setItem('token', data.token); 
      return { success: true };
    } catch (err) {
      setError(err.message);
      if (err.fields) setFieldErrors(err.fields);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, fieldErrors };
}