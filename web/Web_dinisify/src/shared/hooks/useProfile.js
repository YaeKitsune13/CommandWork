import { useEffect, useState, useCallback } from 'react';
import { userApi } from '../api/userApi';

export function useProfile(id) {
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, fw, fg] = await Promise.all([
        userApi.getProfile(id),
        userApi.getFollowers(id).catch(() => []),
        userApi.getFollowing(id).catch(() => []),
      ]);
      setProfile(p);
      setFollowers(Array.isArray(fw) ? fw : []);
      setFollowing(Array.isArray(fg) ? fg : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, followers, following, loading, error, reload: load };
}