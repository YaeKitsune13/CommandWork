import { useEffect, useState } from 'react';
import { discoveryApi } from '../api/discoveryApi';

export function useSearch(query, delay = 300) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await discoveryApi.search(trimmed);
        setResults(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return { results, loading, error };
}