# Phase 4: Hybrid State Synchronization

## Foundation
- [ ] Set up Redis client and connection
- [ ] Design snapshot data structures
- [ ] Create ChangeTracker class
- [ ] Implement field-level change diffing

## Backend: Snapshot System
- [ ] Create SnapshotManager class
- [ ] Implement Full Cast generation
- [ ] Implement Limited Cast generation
- [ ] Add Redis save with TTL
- [ ] Add snapshot retrieval by tick range
- [ ] Implement periodic full state archiving

## Backend: Integration
- [ ] Hook ChangeTracker into WorldManager
- [ ] Accumulate changes during tick
- [ ] Save snapshot to Redis at tick end
- [ ] Update SSE to push Limited Cast
- [ ] Create `/world/init` endpoint
- [ ] Create `/world/snapshots` endpoint

## Frontend: State Sync
- [ ] Create StateSync service
- [ ] Implement initial state loading
- [ ] Add incremental update application
- [ ] Handle field-level change merging
- [ ] Add reconnection/recovery logic
- [ ] Update WorldContext to use StateSync

## Testing & Verification
- [ ] Unit tests for ChangeTracker
- [ ] Integration tests for Redis operations
- [ ] E2E tests for client sync flow
- [ ] Test full state initialization
- [ ] Test real-time SSE updates
- [ ] Test snapshot retrieval
- [ ] Performance benchmarking
- [ ] Memory leak checks
