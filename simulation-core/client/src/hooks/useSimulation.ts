import { useState, useEffect, useCallback } from 'react';
import type { SimulationStatus } from '../types/world';
import { api } from '../services/api';

export function useSimulation() {
  const [status, setStatus] = useState<SimulationStatus>({ paused: true, speed: 1 });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const newStatus = await api.getSimulationStatus();
      setStatus(newStatus);
    } catch (err) {
      console.error('Failed to fetch simulation status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll status less frequently than world state
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const play = async () => {
    setLoading(true);
    try {
      await api.playSimulation();
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const pause = async () => {
    setLoading(true);
    try {
      await api.pauseSimulation();
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const setSpeed = async (speed: number) => {
    setLoading(true);
    try {
      await api.setSimulationSpeed(speed);
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, play, pause, setSpeed };
}
