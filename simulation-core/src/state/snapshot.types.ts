import { Vector2 } from '../types';

// Snapshot data structures
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
  field: string;  // e.g., "position.x", "needs.hunger", "inventory.0.quantity"
  oldValue: any;
  newValue: any;
}
