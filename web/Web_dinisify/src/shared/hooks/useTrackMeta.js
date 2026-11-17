import { useEffect, useState } from 'react';
import { trackApi } from '../api/trackApi';

export function useTrackMeta(id) {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    trackApi
      .meta(id)
      .then((data) => !cancelled && setTrack(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { track, loading, error };
}