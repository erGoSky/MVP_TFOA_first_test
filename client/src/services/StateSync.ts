import type { WorldState, Vector2 } from '../types/world';

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
      const response = await fetch('/world/init');
      if (!response.ok) throw new Error('Failed to fetch initial state');
      
      const data = await response.json();
      
      // If we have a full state, use it
      if (data.fullState) {
        this.currentState = data.fullState;
        this.onStateUpdate(this.currentState!);
      }
      
      // Connect to SSE for updates
      this.connectSSE();
    } catch (error) {
      console.error('State initialization failed:', error);
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

    this.eventSource = new EventSource('/events');

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'snapshot') {
          this.handleSnapshot(data);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Reconnection is handled automatically by EventSource, 
      // but we might want to re-fetch full state if disconnected for too long
    };
  }

  /**
   * Handle incoming snapshot
   */
  private handleSnapshot(snapshot: { tick: number; changes: LimitedChangeSet }): void {
    if (!this.currentState) return;

    // Check for tick continuity
    if (snapshot.tick > this.currentState.tick + 1) {
      console.warn(`Tick gap detected: ${this.currentState.tick} -> ${snapshot.tick}. Requesting full sync.`);
      this.initialize(); // Re-sync
      return;
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
    changes.entityCreated.forEach(creation => {
        // For limited cast, we only get basic info. 
        // In a real implementation, we might need to fetch full entity details 
        // if it's in view, or the limited cast should include enough render data.
        // For now, we'll create a placeholder if it doesn't exist.
        if (!this.currentState!.entities[creation.id]) {
             // This is imperfect because we don't have the full entity data from limited cast
             // But for now, let's assume we just update position if it exists, 
             // or we might need to request entity details.
             // Given the requirements, let's assume limited cast is for visual updates.
             // If we need full data, we'd use the full cast or fetch entity.
             
             // Actually, for the client to render, it needs at least the type and position.
             // The limited cast provides that.
             // We can create a minimal entity representation.
             this.currentState!.entities[creation.id] = {
                 id: creation.id,
                 type: creation.type,
                 position: creation.position,
                 // Other fields would be missing/default
             } as any;
        }
    });

    // 2. Entity Moves
    changes.entityMoved.forEach(move => {
      const entity = this.currentState!.entities[move.id];
      if (entity) {
        entity.position = move.position;
        
        // Also update in specific maps if needed
        if (entity.type === 'npc' && this.currentState!.npcs[move.id]) {
            this.currentState!.npcs[move.id].position = move.position;
        }
        if (entity.type === 'resource' && this.currentState!.resources[move.id]) {
            this.currentState!.resources[move.id].position = move.position;
        }
      }
    });

    // 3. Entity Removals
    changes.entityRemoved.forEach(id => {
      delete this.currentState!.entities[id];
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
