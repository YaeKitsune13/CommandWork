import { useState } from 'react';
import { userApi } from '../api/userApi';

export function useFollow(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const action = async (fn, id) => {
    setLoading(true);
    setError(null);
    try {
      await fn(id);
      onSuccess?.();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    follow: (id) => action(userApi.follow, id),
    unfollow: (id) => action(userApi.unfollow, id),
    loading,
    error,
  };
}