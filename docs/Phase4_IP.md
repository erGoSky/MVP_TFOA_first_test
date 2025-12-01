# Phase 4: Hybrid State Synchronization System

## Goal
Refactor world state communication to use a hybrid model combining Redis-backed snapshots for reliability and SSE for real-time updates, with complete decoupling from business logic.

## Architecture Overview

### Two-Channel System
1. **Snapshot Channel** (Redis): Reliable state initialization and recovery
2. **Real-time Channel** (SSE): Low-latency incremental updates

### Data Structures

#### Snapshot Format
```typescript
interface WorldSnapshot {
  worldId: string;
  tick: number;
  timestamp: number;
  fullCast: FullChangeSet;    // Complete field-level changes
  limitedCast: LimitedChangeSet; // Visible changes only
}

interface FullChangeSet {
  entities: {
    created: EntityChange[];
    updated: FieldChange[];
    deleted: string[];
  };
  npcs: FieldChange[];
  resources: FieldChange[];
  buildings: FieldChange[];
}

interface LimitedChangeSet {
  // Only world-visible changes
  entityMoved: { id: string; position: Vector2 }[];
  entityCreated: { id: string; type: string; position: Vector2 }[];
  entityRemoved: string[];
}

interface FieldChange {
  entityId: string;
  field: string;  // e.g., "position.x", "needs.hunger"
  oldValue: any;
  newValue: any;
}
```

## Proposed Changes

### 1. Backend: Change Tracking System

#### NEW: `simulation-core/src/state/ChangeTracker.ts`
Decoupled change tracking service:
- Intercepts all state mutations
- Accumulates field-level changes per tick
- Generates both Full and Limited casts
- No business logic dependencies

#### NEW: `simulation-core/src/state/SnapshotManager.ts`
Manages snapshot lifecycle:
- Creates snapshots from ChangeTracker data
- Saves to Redis with TTL (10 min configurable)
- Handles full state archiving (periodic)
- Provides snapshot retrieval

#### MODIFY: `simulation-core/src/world.ts`
Integrate change tracking:
- Initialize ChangeTracker
- Hook into entity mutations
- Call SnapshotManager at tick end

---

### 2. Backend: Redis Integration

#### NEW: `simulation-core/src/redis/RedisClient.ts`
Redis connection and operations:
- Connection management
- Key-value operations
- TTL management

#### Redis Schema
```
Keys:
- snapshot:{worldId}:{tick}      → WorldSnapshot (TTL: 10 min)
- full_state:{worldId}           → Complete WorldState (updated periodically)
- latest_tick:{worldId}          → Current tick number

Archive Strategy:
- Every N ticks (configurable), save full state to permanent storage
- Update full_state:{worldId} key
```

---

### 3. Backend: API Endpoints

#### NEW: `GET /world/init`
Initial state fetch:
```typescript
Response: {
  fullState: WorldState;
  currentTick: number;
  latestSnapshot: WorldSnapshot;
}
```

#### NEW: `GET /world/snapshots?from={tick}&to={tick}`
Retrieve snapshot range (fallback for missed updates):
```typescript
Response: {
  snapshots: WorldSnapshot[];
}
```

#### MODIFY: `GET /events` (SSE)
Enhanced SSE stream:
```typescript
Event: {
  type: 'snapshot';
  tick: number;
  changes: LimitedChangeSet;
}
```

---

### 4. Frontend: State Management

#### NEW: `client/src/services/StateSync.ts`
Centralized state synchronization:
- Fetches initial state on mount
- Subscribes to SSE for real-time updates
- Applies field-level changes to local state
- Handles reconnection/recovery

#### MODIFY: `client/src/context/WorldContext.tsx`
Use StateSync service:
- Replace direct SSE subscription
- Apply incremental updates
- Trigger full state refresh on divergence

---

## Implementation Steps

### Phase 1: Foundation (Backend)
1. Set up Redis client and connection
2. Create ChangeTracker with field-level diffing
3. Implement SnapshotManager
4. Add `/world/init` endpoint

### Phase 2: Integration (Backend)
1. Hook ChangeTracker into WorldManager
2. Save snapshots to Redis at tick end
3. Implement periodic full state archiving
4. Update SSE to push LimitedCast

### Phase 3: Client Updates
1. Create StateSync service
2. Implement initial state loading
3. Add incremental update application
4. Handle reconnection logic

### Phase 4: Testing & Optimization
1. Test full state initialization
2. Test incremental updates via SSE
3. Test snapshot retrieval from Redis
4. Performance benchmarking
5. Memory leak checks

---

## Verification Plan

### Automated Tests
- Unit tests for ChangeTracker (field-level diffing)
- Integration tests for snapshot save/load
- E2E tests for client sync flow

### Manual Verification
1. **Initial Load**: Client fetches full state correctly
2. **Real-time Updates**: SSE delivers changes with <100ms latency
3. **Recovery**: Client reconnects and syncs after disconnect
4. **Redis TTL**: Old snapshots expire correctly
5. **Full State Archive**: Periodic saves work

---

## User Review Required

> [!IMPORTANT]
> **Redis Dependency**: This adds Redis as a required service. Ensure Redis is available in deployment environment.

> [!WARNING]
> **Breaking Change**: Existing `/events` SSE format will change. Frontend must be updated simultaneously.

---

## Configuration

```typescript
// simulation-core/src/config.ts
export const SNAPSHOT_CONFIG = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SNAPSHOT_TTL: 600, // 10 minutes in seconds
  ARCHIVE_INTERVAL: 100, // Archive every 100 ticks
  WORLD_ID: 'default'
};
```
