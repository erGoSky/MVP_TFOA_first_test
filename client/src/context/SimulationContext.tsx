import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SimulationStatus } from "../types/world";
import { api } from "../services/api";

/**
 * Context value for simulation control.
 */
interface SimulationContextType {
  /** Current simulation status (paused, speed, tick) */
  status: SimulationStatus;
  /** Whether a control operation is in progress */
  loading: boolean;
  /** Resumes the simulation */
  play: () => Promise<void>;
  /** Pauses the simulation */
  pause: () => Promise<void>;
  /** Sets the simulation speed multiplier */
  setSpeed: (speed: number) => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

/**
 * Provider component for simulation control state.
 *
 * This centralizes simulation status management to prevent duplicate polling
 * when multiple components need access to the simulation state.
 *
 * @example
 * ```tsx
 * <SimulationProvider>
 *   <App />
 * </SimulationProvider>
 * ```
 */
export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SimulationStatus>({ paused: true, speed: 1, tick: 0 });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const newStatus = await api.getSimulationStatus();
      setStatus(newStatus);
    } catch (err) {
      console.error("Failed to fetch simulation status:", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
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

  return (
    <SimulationContext.Provider value={{ status, loading, play, pause, setSpeed }}>
      {children}
    </SimulationContext.Provider>
  );
};

/**
 * Hook to access simulation control state and actions.
 *
 * Must be used within a SimulationProvider.
 *
 * @returns Simulation status and control functions
 * @throws Error if used outside SimulationProvider
 *
 * @example
 * ```tsx
 * function SimulationControls() {
 *   const { status, play, pause } = useSimulation();
 *   return <button onClick={status.paused ? play : pause}>
 *     {status.paused ? 'Play' : 'Pause'}
 *   </button>;
 * }
 * ```
 */
export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
};
