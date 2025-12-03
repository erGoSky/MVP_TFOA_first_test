import { Entity } from "../types";

/**
 * Type of change that occurred to an entity.
 */
export type ChangeType = "created" | "updated" | "removed";

/**
 * Represents a single entity change event.
 */
export interface EntityChange {
  /** Unique identifier of the changed entity */
  id: string;
  /** Type of change that occurred */
  type: ChangeType;
  /** Entity data snapshot (present for created/updated, undefined for removed) */
  entity?: Entity;
  /** Timestamp when the change was recorded */
  timestamp: number;
}

/**
 * Collection of all entity changes that occurred in a single simulation tick.
 */
export interface TickDelta {
  /** Simulation tick number when these changes occurred */
  tick: number;
  /** Array of entity changes that occurred in this tick */
  changes: EntityChange[];
}

/**
 * Manages state delta tracking for efficient client updates.
 *
 * The DeltaManager maintains a circular buffer of entity changes, allowing clients
 * to request only the changes since their last known tick instead of the full world state.
 * This significantly reduces network bandwidth and improves performance.
 *
 * @example
 * ```typescript
 * const deltaManager = new DeltaManager({ maxBufferSize: 100 });
 *
 * // Record changes during a tick
 * deltaManager.addChange("npc_1", "created", npcEntity);
 * deltaManager.addChange("resource_5", "removed");
 *
 * // Commit changes at end of tick
 * deltaManager.commitTick(42);
 *
 * // Client requests changes since tick 40
 * const deltas = deltaManager.getDeltaSince(40);
 * ```
 */
export class DeltaManager {
  private buffer: TickDelta[] = [];
  private currentTickChanges: EntityChange[] = [];
  private maxBufferSize: number = 100; // Default size

  /**
   * Creates a new DeltaManager instance.
   *
   * @param config - Optional configuration
   * @param config.maxBufferSize - Maximum number of tick deltas to keep in buffer (default: 100)
   */
  constructor(config?: { maxBufferSize?: number }) {
    if (config?.maxBufferSize) {
      this.maxBufferSize = config.maxBufferSize;
    }
  }

  /**
   * Updates the maximum buffer size and prunes old entries if necessary.
   *
   * @param size - New maximum buffer size
   */
  public setMaxBufferSize(size: number) {
    this.maxBufferSize = size;
    this.pruneBuffer();
  }

  /**
   * Records an entity change for the current tick.
   *
   * Changes are buffered until `commitTick()` is called. The entity data is deep-copied
   * to preserve the state at the time of the change.
   *
   * @param id - Unique identifier of the changed entity
   * @param type - Type of change (created, updated, or removed)
   * @param entity - Entity data (required for created/updated, omit for removed)
   */
  public addChange(id: string, type: ChangeType, entity?: Entity) {
    this.currentTickChanges.push({
      id,
      type,
      entity: entity ? JSON.parse(JSON.stringify(entity)) : undefined, // Deep copy to snapshot state
      timestamp: Date.now(),
    });
  }

  /**
   * Commits all buffered changes for the current tick.
   *
   * This finalizes the changes and adds them to the delta buffer. The buffer is
   * automatically pruned if it exceeds the maximum size.
   *
   * @param tick - Current simulation tick number
   */
  public commitTick(tick: number) {
    if (this.currentTickChanges.length > 0) {
      this.buffer.push({
        tick,
        changes: [...this.currentTickChanges],
      });
      this.currentTickChanges = [];

      this.pruneBuffer();
    }
  }

  /**
   * Removes oldest tick deltas when buffer exceeds maximum size.
   * @private
   */
  private pruneBuffer() {
    while (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /**
   * Retrieves all tick deltas since a specific tick.
   *
   * This is used by clients to get incremental updates instead of the full world state.
   *
   * @param lastTick - Last tick number the client has processed
   * @returns Array of tick deltas that occurred after the specified tick
   *
   * @example
   * ```typescript
   * // Client last processed tick 100, now at tick 105
   * const deltas = deltaManager.getDeltaSince(100);
   * // Returns deltas for ticks 101, 102, 103, 104, 105
   * ```
   */
  public getDeltaSince(lastTick: number): TickDelta[] {
    return this.buffer.filter((delta) => delta.tick > lastTick);
  }

  /**
   * Clears all buffered deltas and current tick changes.
   *
   * This is typically called when the world is reset or a new game is started.
   */
  public reset() {
    this.buffer = [];
    this.currentTickChanges = [];
  }
}
