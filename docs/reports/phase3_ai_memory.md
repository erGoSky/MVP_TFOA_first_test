# Phase 3: AI Memory System

## Overview
This phase introduced a memory system for NPCs, enabling them to remember the locations of resources and buildings they have previously seen. This allows for more intelligent navigation and reduces random wandering when looking for specific targets.

## Key Features

### 1. Memory Structure
NPCs now have a `memory` property that stores:
-   **Locations**: A map of entity IDs to `MemoryItem` objects (position, type, timestamp).
-   **Last Seen**: A map of entity subtypes (e.g., 'tree_oak') to the last timestamp they were seen.

### 2. Memory System Logic
A new `MemorySystem` class handles:
-   **Updates**: Every tick, NPCs update their memory based on currently visible entities (10-tile radius).
-   **Retrieval**: NPCs can query memory for the nearest known location of a specific resource type.
-   **Forgetting**: If an NPC visits a remembered location and the entity is missing, it is removed from memory.

### 3. Intelligent Navigation
The `WorldManager` and `MoveHandler` were updated to utilize memory:
-   **Resource Search**: When looking for a resource (e.g., in `getResourceOptions`), NPCs first check visible entities. If none are found, they check their memory.
-   **Movement**: The `MoveHandler` can now target entities that are not currently in the active world state (i.e., not visible or loaded) by falling back to the coordinates stored in memory.

## Technical Implementation

### Modified Files
-   **`simulation-core/src/types.ts`**: Added `MemoryItem`, `NPCMemory` interfaces; updated `NPC` interface.
-   **`simulation-core/src/ai/memory.system.ts`**: New file implementing `MemorySystem` class.
-   **`simulation-core/src/world.ts`**:
    -   Integrated `MemorySystem`.
    -   Updated `createNPC` to initialize memory.
    -   Updated `tick()` to call `memorySystem.updateMemory`.
    -   Updated `getResourceOptions` to query memory.
-   **`simulation-core/src/actions/handlers/move.handler.ts`**: Added fallback to memory for target positions.

## Verification
1.  **Memory Formation**: Spawn an NPC near resources. They should populate their memory.
2.  **Recall**: Move the NPC away. They should be able to return to the resource location even if it's out of sight.
3.  **Forgetting**: If the resource is removed while the NPC is away, the NPC should travel to the location, realize it's gone, and update their memory.
