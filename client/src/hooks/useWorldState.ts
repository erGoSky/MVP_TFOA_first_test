import { useState, useEffect, useCallback, useRef } from "react";
import type { WorldState, SimulationStatus } from "../types/world";
import { api } from "../services/api";
import { useSimulation } from "./useSimulation";

/**
 * Hook for managing world state with delta updates and pause-aware polling.
 *
 * This hook fetches the initial world state and then polls for incremental updates
 * (deltas) to minimize network bandwidth. It automatically pauses polling when the
 * simulation is paused.
 *
 * @param pollingInterval - Milliseconds between state polls (default: 1000)
 * @returns World state, loading status, error, and manual refetch function
 *
 * @example
 * ```tsx
 * function WorldViewer() {
 *   const { worldState, loading, error } = useWorldState(1000);
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>NPCs: {Object.keys(worldState.npcs).length}</div>;
 * }
 * ```
 */
export function useWorldState(pollingInterval = 1000) {
  const { status } = useSimulation();
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const hasInitialFetchRef = useRef(false);

  /**
   * Applies delta changes to the current world state.
   *
   * @param currentState - Current world state
   * @param delta - Array of tick deltas to apply
   * @returns New world state with deltas applied
   * @private
   */
  const applyDelta = useCallback((currentState: WorldState, delta: any[]): WorldState => {
    // Apply delta changes to current state
    const newState = { ...currentState };

    for (const tickDelta of delta) {
      for (const change of tickDelta.changes) {
        if (change.type === "created" || change.type === "updated") {
          const entity = change.entity;
          if (entity.type === "npc") {
            newState.npcs = { ...newState.npcs, [entity.id]: entity };
          } else if (entity.type === "resource") {
            newState.resources = { ...newState.resources, [entity.id]: entity };
          } else if (entity.type === "building") {
            newState.buildings = { ...newState.buildings, [entity.id]: entity };
          }
          newState.entities = { ...newState.entities, [entity.id]: entity };
        } else if (change.type === "removed") {
          const { [change.id]: removed, ...restNpcs } = newState.npcs;
          const { [change.id]: removedRes, ...restResources } = newState.resources;
          const { [change.id]: removedBld, ...restBuildings } = newState.buildings;
          const { [change.id]: removedEnt, ...restEntities } = newState.entities;

          newState.npcs = restNpcs;
          newState.resources = restResources;
          newState.buildings = restBuildings;
          newState.entities = restEntities;
        }
      }
    }

    return newState;
  }, []);

  const fetchState = useCallback(async () => {
    try {
      if (lastTickRef.current === null) {
        // First fetch - get full state
        const state = await api.fetchWorldState();
        setWorldState(state);
        lastTickRef.current = state.tick;
        hasInitialFetchRef.current = true;
      } else {
        // Subsequent fetches - get delta
        const deltaResponse = await api.fetchWorldStateDelta(lastTickRef.current);

        if (deltaResponse.delta.length > 0) {
          setWorldState((currentState) => {
            if (!currentState) return currentState;
            const newState = applyDelta(currentState, deltaResponse.delta);
            newState.tick = deltaResponse.tick;
            return newState;
          });
        }
        // Always update tick reference, even if no changes
        lastTickRef.current = deltaResponse.tick;
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [applyDelta]);

  useEffect(() => {
    // Always fetch initial state on mount
    if (!hasInitialFetchRef.current) {
      fetchState();
    }

    const interval = setInterval(() => {
      // Only fetch updates if simulation is running
      if (!status.paused) {
        fetchState();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchState, pollingInterval, status.paused]);

  return { worldState, loading, error, refetch: fetchState };
}
