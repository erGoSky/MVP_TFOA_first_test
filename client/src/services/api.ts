import type { WorldState, SimulationStatus } from "../types/world";

/**
 * API client for communicating with the simulation server.
 *
 * Provides methods for fetching world state, controlling simulation,
 * and managing state synchronization via delta updates.
 */
export const api = {
  /**
   * Fetches the complete world state from the server.
   *
   * @returns Promise resolving to the full world state
   * @throws Error if the request fails
   */
  async fetchWorldState(): Promise<WorldState> {
    const response = await fetch("/state");
    if (!response.ok) {
      throw new Error("Failed to fetch world state");
    }
    return response.json();
  },

  /**
   * Fetches incremental state changes since a specific tick.
   *
   * This is more efficient than fetching the full state when only
   * recent changes are needed.
   *
   * @param lastTick - Last tick number the client has processed
   * @returns Promise resolving to tick number and delta changes
   * @throws Error if the request fails
   */
  async fetchWorldStateDelta(lastTick: number): Promise<{ tick: number; delta: any[] }> {
    const response = await fetch(`/state?lastTick=${lastTick}`);
    if (!response.ok) {
      throw new Error("Failed to fetch world state delta");
    }
    return response.json();
  },

  /**
   * Gets the current simulation status.
   *
   * @returns Promise resolving to simulation status (paused, speed, tick)
   * @throws Error if the request fails
   */
  async getSimulationStatus(): Promise<SimulationStatus> {
    const response = await fetch("/simulation/status");
    if (!response.ok) {
      throw new Error("Failed to fetch simulation status");
    }
    return response.json();
  },

  /**
   * Resumes the simulation.
   *
   * @returns Promise that resolves when the command is sent
   */
  async playSimulation(): Promise<void> {
    await fetch("/simulation/play", { method: "POST" });
  },

  /**
   * Pauses the simulation.
   *
   * @returns Promise that resolves when the command is sent
   */
  async pauseSimulation(): Promise<void> {
    await fetch("/simulation/pause", { method: "POST" });
  },

  /**
   * Sets the simulation speed multiplier.
   *
   * @param speed - Speed multiplier (1, 2, 4, 8, or 16)
   * @returns Promise that resolves when the command is sent
   */
  async setSimulationSpeed(speed: number): Promise<void> {
    await fetch("/simulation/speed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed }),
    });
  },
};
