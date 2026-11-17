import { useEffect, useState } from 'react';
import { albumApi } from '../api/albumApi';

export function useAlbum(id) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    albumApi
      .get(id)
      .then((data) => !cancelled && setAlbum(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { album, loading, error };
}