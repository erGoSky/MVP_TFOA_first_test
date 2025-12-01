import { useState, useEffect, useRef } from 'react';
import type { WorldState } from '../types/world';
import { StateSyncService } from '../services/StateSync';

export function useWorldState() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const syncServiceRef = useRef<StateSyncService | null>(null);

  useEffect(() => {
    const syncService = new StateSyncService((newState) => {
      setWorldState({ ...newState }); // Create new object to trigger re-render
      setLoading(false);
    });
    
    syncServiceRef.current = syncService;
    
    syncService.initialize().catch(err => {
      console.error('Failed to initialize state sync:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize state sync'));
      setLoading(false);
    });

    return () => {
      syncService.disconnect();
    };
  }, []);

  return { worldState, loading, error };
}
