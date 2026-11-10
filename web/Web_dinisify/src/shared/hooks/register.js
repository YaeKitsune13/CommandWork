import { useState } from 'react';
import { authApi } from '../api/authApi';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = async (email, password, nickname = null) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(email, password, nickname);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}