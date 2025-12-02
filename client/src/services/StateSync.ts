import type { WorldState, Vector2 } from "../types/world";

// Types matching backend snapshot types
export interface WorldSnapshot {
  worldId: string;
  tick: number;
  timestamp: number;
  fullCast: FullChangeSet;
  limitedCast: LimitedChangeSet;
}

export interface FullChangeSet {
  entities: {
    created: EntityChange[];
    updated: FieldChange[];
    deleted: string[];
  };
}

export interface LimitedChangeSet {
  entityMoved: Array<{ id: string; position: Vector2 }>;
  entityCreated: Array<{ id: string; type: string; position: Vector2 }>;
  entityRemoved: string[];
  npcUpdated: Array<{
    id: string;
    needs?: any;
    stats?: any;
    currentAction?: string | null;
    inventory?: any[];
  }>;
}

export interface EntityChange {
  id: string;
  type: string;
  data: any;
}

export interface FieldChange {
  entityId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

export class StateSyncService {
  private eventSource: EventSource | null = null;
  private onStateUpdate: (state: WorldState) => void;
  private currentState: WorldState | null = null;

  constructor(onStateUpdate: (state: WorldState) => void) {
    this.onStateUpdate = onStateUpdate;
  }

  /**
   * Initialize state from server
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch("/world/init");
      if (!response.ok) throw new Error("Failed to fetch initial state");

      const data = await response.json();

      // If we have a full state, use it
      if (data.fullState) {
        this.currentState = data.fullState;
        this.onStateUpdate(this.currentState!);
      }

      // Connect to SSE for updates
      this.connectSSE();
    } catch (error) {
      console.error("State initialization failed:", error);
      // Retry logic could go here
    }
  }

  /**
   * Connect to Server-Sent Events
   */
  private connectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource("/events");

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "snapshot") {
          this.handleSnapshot(data);
        }
      } catch (error) {
        console.error("Error parsing SSE event:", error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Reconnection is handled automatically by EventSource,
      // but we might want to re-fetch full state if disconnected for too long
    };
  }

  /**
   * Handle incoming snapshot
   */
  private handleSnapshot(snapshot: { tick: number; changes: LimitedChangeSet }): void {
    if (!this.currentState) return;

    // Check for tick continuity - if there's a gap, just accept it and continue
    // This can happen when the client loads while the simulation is already running
    if (snapshot.tick > this.currentState.tick + 1) {
      console.warn(
        `Tick gap detected: ${this.currentState.tick} -> ${snapshot.tick}. Accepting jump and continuing.`
      );
      // Just update the tick and continue - the limited cast only contains position updates
      // which are absolute, so we don't need the intermediate ticks
    }

    // Apply changes
    this.applyChanges(snapshot.changes);

    // Update tick
    this.currentState.tick = snapshot.tick;

    // Notify listeners
    this.onStateUpdate({ ...this.currentState });
  }

  /**
   * Apply changes to local state
   */
  private applyChanges(changes: LimitedChangeSet): void {
    if (!this.currentState) return;

    // 1. Entity Creations
    changes.entityCreated.forEach((creation) => {
      const entity = {
        id: creation.id,
        type: creation.type,
        position: creation.position,
        // Defaults
        inventory: [],
        properties: {},
      } as any;

      if (creation.type === "npc") {
        if (!this.currentState!.npcs[creation.id]) {
          this.currentState!.npcs[creation.id] = {
            ...entity,
            name: "New NPC",
            needs: { hunger: 0, energy: 1, social: 1 },
            stats: { health: 100, money: 0, speed: 1 },
            skills: { gathering: 0, crafting: 0, trading: 0 },
          };
        }
      } else if (creation.type === "resource") {
        if (!this.currentState!.resources[creation.id]) {
          this.currentState!.resources[creation.id] = {
            ...entity,
            resourceType: "unknown",
            amount: 10,
          };
        }
      } else if (creation.type === "building") {
        if (!this.currentState!.buildings[creation.id]) {
          this.currentState!.buildings[creation.id] = {
            ...entity,
            buildingType: "unknown",
            gold: 0,
          };
        }
      }
    });

    // 2. Entity Moves
    changes.entityMoved.forEach((move) => {
      // Try to find in NPCs
      if (this.currentState!.npcs[move.id]) {
        this.currentState!.npcs[move.id].position = move.position;
        return;
      }
      // Try to find in Resources
      if (this.currentState!.resources[move.id]) {
        this.currentState!.resources[move.id].position = move.position;
        return;
      }
      // Try to find in Buildings (unlikely to move, but possible)
      if (this.currentState!.buildings[move.id]) {
        this.currentState!.buildings[move.id].position = move.position;
        return;
      }
    });

    // 3. Entity Removals
    changes.entityRemoved.forEach((id) => {
      delete this.currentState!.npcs[id];
      delete this.currentState!.resources[id];
      delete this.currentState!.buildings[id];
    });
  }

  /**
   * Clean up resources
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
