import type { WorldState, SimulationStatus } from '../types/world';

export const api = {
  async fetchWorldState(): Promise<WorldState> {
    const response = await fetch('/state');
    if (!response.ok) {
      throw new Error('Failed to fetch world state');
    }
    return response.json();
  },

  async getSimulationStatus(): Promise<SimulationStatus> {
    const response = await fetch('/simulation/status');
    if (!response.ok) {
      throw new Error('Failed to fetch simulation status');
    }
    return response.json();
  },

  async playSimulation(): Promise<void> {
    await fetch('/simulation/play', { method: 'POST' });
  },

  async pauseSimulation(): Promise<void> {
    await fetch('/simulation/pause', { method: 'POST' });
  },

  async setSimulationSpeed(speed: number): Promise<void> {
    await fetch('/simulation/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
  }
};
