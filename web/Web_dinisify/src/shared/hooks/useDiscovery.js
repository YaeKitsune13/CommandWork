import { useEffect, useState, useCallback } from 'react';
import { discoveryApi } from '../api/discoveryApi';

export function useDiscovery(kind = 'charts', options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        kind === 'charts'
          ? await discoveryApi.charts(options)
          : await discoveryApi.recommendations(options.limit ?? 20);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind, JSON.stringify(options)]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}