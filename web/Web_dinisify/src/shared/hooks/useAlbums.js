import { useCallback, useEffect, useState } from 'react';
import { albumApi } from '../api/albumApi';

export function useAlbums(search = null) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    albumApi
      .getAll(search)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.items;
        setAlbums(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, reloadTick]);

  return { albums, loading, error, reload };
}