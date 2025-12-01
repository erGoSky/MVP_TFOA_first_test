import { WorldSnapshot, FullChangeSet, LimitedChangeSet } from './snapshot.types';
import { WorldState } from '../types';
import { redisClient } from '../redis/RedisClient';
import { SNAPSHOT_CONFIG } from '../config/snapshot.config';

export class SnapshotManager {
  private lastArchiveTick: number = 0;

  /**
   * Create and save a snapshot to Redis
   */
  async saveSnapshot(
    worldId: string,
    tick: number,
    fullCast: FullChangeSet,
    limitedCast: LimitedChangeSet
  ): Promise<void> {
    const snapshot: WorldSnapshot = {
      worldId,
      tick,
      timestamp: Date.now(),
      fullCast,
      limitedCast
    };

    const key = this.getSnapshotKey(worldId, tick);
    const value = JSON.stringify(snapshot);

    await redisClient.set(key, value, SNAPSHOT_CONFIG.SNAPSHOT_TTL);
    
    // Update latest tick
    await redisClient.set(
      this.getLatestTickKey(worldId),
      tick.toString()
    );

    console.log(`Snapshot saved: ${key}`);
  }

  /**
   * Retrieve a specific snapshot
   */
  async getSnapshot(worldId: string, tick: number): Promise<WorldSnapshot | null> {
    const key = this.getSnapshotKey(worldId, tick);
    const value = await redisClient.get(key);

    if (!value) return null;

    return JSON.parse(value) as WorldSnapshot;
  }

  /**
   * Retrieve snapshots in a range
   */
  async getSnapshotRange(worldId: string, fromTick: number, toTick: number): Promise<WorldSnapshot[]> {
    const snapshots: WorldSnapshot[] = [];

    for (let tick = fromTick; tick <= toTick; tick++) {
      const snapshot = await this.getSnapshot(worldId, tick);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots;
  }

  /**
   * Get the latest tick number
   */
  async getLatestTick(worldId: string): Promise<number> {
    const value = await redisClient.get(this.getLatestTickKey(worldId));
    return value ? parseInt(value) : 0;
  }

  /**
   * Save full world state (periodic archiving)
   */
  async saveFullState(worldId: string, state: WorldState): Promise<void> {
    const key = this.getFullStateKey(worldId);
    const value = JSON.stringify(state);

    await redisClient.set(key, value);
    this.lastArchiveTick = state.tick;

    console.log(`Full state archived at tick ${state.tick}`);
  }

  /**
   * Retrieve full world state
   */
  async getFullState(worldId: string): Promise<WorldState | null> {
    const key = this.getFullStateKey(worldId);
    const value = await redisClient.get(key);

    if (!value) return null;

    return JSON.parse(value) as WorldState;
  }

  /**
   * Check if archiving is needed
   */
  shouldArchive(currentTick: number): boolean {
    return (currentTick - this.lastArchiveTick) >= SNAPSHOT_CONFIG.ARCHIVE_INTERVAL;
  }

  /**
   * Clean up old snapshots (optional, TTL handles this automatically)
   */
  async cleanupOldSnapshots(worldId: string, beforeTick: number): Promise<void> {
    const pattern = this.getSnapshotKey(worldId, '*');
    const keys = await redisClient.keys(pattern);

    for (const key of keys) {
      const parts = key.split(':');
      const tick = parseInt(parts[parts.length - 1]);
      
      if (tick < beforeTick) {
        await redisClient.delete(key);
      }
    }
  }

  // Key generation helpers
  private getSnapshotKey(worldId: string, tick: number | string): string {
    return `snapshot:${worldId}:${tick}`;
  }

  private getFullStateKey(worldId: string): string {
    return `full_state:${worldId}`;
  }

  private getLatestTickKey(worldId: string): string {
    return `latest_tick:${worldId}`;
  }
}
