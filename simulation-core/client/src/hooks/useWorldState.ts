import { useState, useEffect, useCallback } from 'react';
import type { WorldState } from '../types/world';
import { api } from '../services/api';

export function useWorldState(pollingInterval = 1000) {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const state = await api.fetchWorldState();
      setWorldState(state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchState, pollingInterval]);

  return { worldState, loading, error, refetch: fetchState };
}
