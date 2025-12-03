# Phase 8: Decision Making & Memory Implementation Report

## Overview
This phase focused on enhancing NPC autonomy through an advanced memory system and robust fallback behaviors when AI planning fails. It also included significant improvements to debug capabilities and simulation control.

## Key Features Implemented

### 1. Advanced Memory System
- **Memory Skill**: Introduced a `memory` skill (1-3) for NPCs, influencing retention capabilities.
- **Session Tracking**: Implemented logic to track "sessions" of interaction (entering/exiting visibility) to prevent spamming interaction counts.
- **Forgetting Curve**:
  - Base retention: 1 tick on first encounter.
  - Reinforcement: Retention duration multiplies by `(1 + 0.2 * memory_skill)` upon re-encounter in a new session.
  - Expiry: Memories are marked as `forgotten` when the current tick exceeds the expiry tick.
- **AI Integration**: The `AISystem` now filters out forgotten memories before requesting plans, ensuring decisions are based on "active" memory.

### 2. AI Fallback Behaviors
- **Planning Failure Handling**: Implemented `handlePlanningFailure` in `AISystem` to catch empty plans or errors.
- **Visual Exploration**: If planning fails, NPCs attempt to move towards the **farthest visible/remembered entity**. This simulates exploration and prevents getting stuck.
- **Wander Fallback**: If no entities are visible, NPCs wander to a random nearby location.
- **Idle Transition**: Fallback moves transition to an `idle` state upon completion to trigger a new plan request.

### 3. Simulation & Debug Improvements
- **Initial Memory on Spawn**: NPCs are now initialized with memories of all entities within their observation radius, preventing "blank slate" behavior on spawn.
- **Paused Start**: The simulation now starts in a **PAUSED** state by default, allowing for initial state inspection.
- **DEBUG_SINGLE_NPC Refactoring**:
  - Removed the single-NPC check from the main event loop (all NPCs now process every tick).
  - Moved debug logic to spawning:
    - `DEBUG_SINGLE_NPC=true`: Spawns 2 NPCs at the exact same location (center).
    - `DEBUG_SINGLE_NPC=<number>`: Spawns `<number>` NPCs near the center.
- **Startup Logging**: Added clear logging of active debug options at simulation start.
- **Cleanup**: Removed the legacy manual `tick()` method from `WorldManager`.

## Files Modified
- `simulation-core/src/types.ts`: Added `memory` skill, updated `MemoryItem` interface.
- `simulation-core/src/ai/memory.system.ts`: Implemented full memory logic.
- `simulation-core/src/systems/ai-system.ts`: Added fallback logic and memory filtering.
- `simulation-core/src/core/entity-manager.ts`: Initialized memory skill.
- `simulation-core/src/world-generator.ts`: Implemented initial memory population and debug spawning logic.
- `simulation-core/src/world.ts`: Refactored tick loop and removed legacy code.
- `simulation-core/src/core/time-manager.ts`: Set default state to paused.

## Verification
- **Automated Tests**: Added unit tests for `MemorySystem` (session tracking, retention, expiry).
- **Manual Verification**: Verified fallback behaviors and debug spawning using `DEBUG_SINGLE_NPC` environment variable.
