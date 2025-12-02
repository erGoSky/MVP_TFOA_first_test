# Phase 3: Interactive Entities & Storage

## Overview
This phase introduced interactive entities to the simulation, enabling deeper gameplay mechanics through storage systems and advanced crafting. We also refactored the entity metadata system to ensure a single source of truth between the backend and frontend.

## Key Features

### 1. Containers & Storage
Entities can now act as containers, allowing NPCs to store and retrieve items.
- **New Entity Types**: `chest_small`, `crate`, `barrel`.
- **Backend Logic**:
  - Added `Container` interface to `Entity`.
  - Implemented `StorageHandler` for `store_item` and `retrieve_item` actions.
  - Updated `WorldGenerator` to place a "Small Chest" with starter items (Bread, Water) near the Tavern.
- **Frontend**:
  - Added dynamic icons for containers (📦, 🟫, 🛢️).

### 2. Workstations & Advanced Crafting
Crafting now requires specific workstations for advanced items, adding spatial constraints to NPC behavior.
- **New Workstation Types**:
  - `crafting_table` (🔨): Basic tools (Pickaxes, Axes).
  - `furnace` (🔥): Smelting ores into ingots.
  - `anvil` (⚒️): Forging weapons and armor.
  - `loom` (🧵): Weaving cloth and bags.
- **Recipe System**:
  - Created `recipes.ts` defining inputs, outputs, crafting time, and **required workstation**.
  - Added skill requirements (e.g., Level 20 Crafting for Iron Sword).
- **Crafting Logic**:
  - Updated `CraftingHandler` to verify the NPC is within 2 tiles of the required workstation.
  - Added skill checks before allowing crafting.

### 3. Entity Metadata Sync (Refactor)
Eliminated code duplication by serving entity definitions from the backend.
- **Backend**:
  - Added `/meta/entities` endpoint.
  - Serves `RESOURCE_TYPES`, `RESOURCE_METADATA`, `BIOME_METADATA`, `CONTAINER_TYPES`, `WORKSTATION_TYPES`, and `WORKSTATION_METADATA`.
- **Frontend**:
  - Created `MetadataContext` to fetch definitions on app load.
  - Created `useEntityVisuals` hook to provide icons and colors dynamically.
  - Removed hardcoded constants (`client/src/constants/entities.ts`).

## Technical Implementation

### Modified Files
- **Backend** (`simulation-core`):
  - `src/types.ts`: Added `Container`, `WorkstationType`.
  - `src/constants/entities.ts`: Added container and workstation constants.
  - `src/constants/recipes.ts`: New file for recipe definitions.
  - `src/actions/handlers/storage.handler.ts`: New handler.
  - `src/actions/handlers/crafting.handler.ts`: Updated with workstation logic.
  - `src/world-generator.ts`: Places chests and workstations.
  - `src/index.ts`: Added `/meta/entities` endpoint.

- **Frontend** (`client`):
  - `src/context/MetadataContext.tsx`: New context provider.
  - `src/hooks/useEntityVisuals.ts`: New hook for UI assets.
  - `src/hooks/useCanvas.ts`: Updated to use metadata hooks.
  - `src/components/map/Sidebar.tsx`: Updated to use local/dynamic icons.

## Verification
1.  **Containers**: Check the chest near the tavern. NPCs should be able to store/retrieve items.
2.  **Workstations**: Verify Crafting Table, Furnace, Anvil, and Loom appear around the tavern.
3.  **Crafting**: Attempt to craft an `iron_sword`. It should fail if not near an Anvil or if missing skills.
4.  **Metadata**: The client should load without errors, and entity icons should display correctly even if changed on the backend.
