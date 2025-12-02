# Phase 3: Item Durability System

## Overview
This phase introduced durability mechanics for tools and equipment. Items now degrade with use and break when durability reaches zero, requiring NPCs to craft or acquire replacements.

## Key Features

### 1. Durability Tracking
- **ItemProperties**: Added `durability` and `maxDurability` properties to track current and maximum durability.
- **Constants**: Defined max durability values for different tool types (e.g., wooden pickaxe: 50, iron pickaxe: 250).

### 2. Tool Degradation
- **Resource Gathering**: Tools degrade during `chop` and `mine` actions.
- **Degradation Rates**: Configurable per action type (currently 1 durability per use).
- **Breakage**: When durability reaches 0, the tool is removed from inventory and the NPC is notified.

### 3. Crafting Integration
- **Initialization**: Newly crafted tools are created with full durability.
- **Non-Stacking**: Durable items (tools) do not stack to preserve individual durability values.
- **Stackable Items**: Non-durable items continue to stack normally.

### 4. UI Visualization
- **Durability Bars**: Small progress bars appear under tools in inventory displays.
- **Color Coding**:
  - Green: >70% durability
  - Yellow: 30-70% durability
  - Red: <30% durability

## Technical Implementation

### Modified Files

#### Backend
- **`simulation-core/src/types.ts`**: Added `maxDurability` to `ItemProperties`.
- **`simulation-core/src/constants/items.ts`**: New file with `ITEM_DURABILITY` and `TOOL_DEGRADATION` constants.
- **`simulation-core/src/actions/handlers/crafting.handler.ts`**: Initialize durability for crafted tools; prevent stacking.
- **`simulation-core/src/actions/handlers/resource.handler.ts`**: Degrade tools during gathering; handle breakage.

#### Frontend
- **`client/src/types/world.ts`**: Added `ItemProperties` interface with durability fields.
- **`client/src/components/map/EntityCard.tsx`**: Render durability bars for items.
- **`client/src/components/map/EntityCard.scss`**: Styles for durability visualization.

## Verification
1. **Crafting**: Craft a tool (e.g., wooden pickaxe). Verify it has full durability.
2. **Usage**: Use the tool to gather resources. Check durability decreases with each use.
3. **Breakage**: Continue using until durability reaches 0. Verify tool is removed from inventory.
4. **UI**: Check that durability bars appear and update correctly in the entity card.
