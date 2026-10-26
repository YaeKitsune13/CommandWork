import { useEffect, useState } from 'react';
import { albumApi } from '../api/albumApi';

export function useAlbums(search = null) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    albumApi
      .getAll(search)
      .then((data) => !cancelled && setAlbums(Array.isArray(data) ? data : []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [search]);

  return { albums, loading, error };
}