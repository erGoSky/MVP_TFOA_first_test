# Phase 4: Advanced AI Planning & Goal Achievement Graph

## Overview
This phase implements a sophisticated **Dynamic Goal Achievement Graph** (GOAP-inspired) for NPCs. It shifts AI from simple state-machine reactions to deep planning, allowing NPCs to decompose complex goals (e.g., "Obtain Crate") into sequences of base actions (Gather -> Process -> Craft OR Gather Gold -> Buy).

## Requirements Mapping

| ID | Requirement | Implementation Strategy |
|----|-------------|-------------------------|
| **FSD.AI.101** | Dynamic Goal Achievement Graph | Implement `GoalManager` and `Planner` that rebuilds plans when state (Needs, Inventory) changes. |
| **FSD.AI.102** | Economic Goal Decomposition | `Planner` evaluates multiple paths (Craft vs. Buy) based on a cost function (Time + Effort + Gold). |
| **FSD.AI.103** | Loop/Repeat Actions | `Goal` structure supports `repetition` or `until_condition` (e.g., "Chop until Level 5"). |
| **FSD.AI.104** | Auto-Order Generation | If "Buy" path is chosen, the `BuyAction` automatically posts a `PurchaseOrder` to the Quest Board. |
| **PRD.AI.201** | Decision Audit Tool | `Planner` logs the evaluated graph and chosen path costs (`W_path`) for UI inspection. |
| **PRD.AI.202** | Scalability (100+ NPCs) | Optimize planner (limit search depth, cache plans, time-slice planning across ticks). |
| **PRD.AI.203** | Emergent Supply Chains | Naturally arises from "Buy" orders creating demand that other NPCs (with "Earn Gold" goals) fulfill. |

## Architecture Design

### 1. Core Systems

#### `ActionPlanner` (The Brain)
-   **Algorithm**: A* or Dijkstra search over the Action Graph.
-   **Input**: Current State (World + NPC), Desired Goal State.
-   **Output**: `Plan` (Stack of `Action` nodes).
-   **Cost Function**: $W_{path} = \sum (ActionCost + OpportunityCost)$.

#### `GoalManager`
-   Manages two queues:
    1.  **Global Goals**: Long-term (e.g., "Reach Level 10 Crafting", "Build House").
    2.  **Local Goals**: Immediate needs (e.g., "Restore Hunger", "Obtain Wood").
-   Prioritizes goals based on NPC `Personality` and `Context` (Desperate vs. Stable).

#### `ActionRegistry`
-   Database of all possible actions (`Chop`, `Craft`, `Buy`, `Sleep`, `Eat`).
-   Each Action defines:
    -   `Preconditions`: What must be true to start (e.g., `HasItem(Axe)`, `Near(Tree)`).
    -   `Effects`: What changes after completion (e.g., `Inventory(Wood) +1`, `Energy -5`).
    -   `Cost`: Base cost + dynamic modifiers.

### 2. Data Structures

```typescript
interface Goal {
  id: string;
  type: 'maintain_need' | 'obtain_item' | 'reach_skill' | 'accumulate_wealth';
  priority: number;
  conditions: StateCondition[]; // e.g., { type: 'item', id: 'crate', count: 1 }
  isGlobal: boolean;
}

interface ActionNode {
  action: string; // 'craft_crate'
  parameters: any;
  cost: number;
  heuristic: number; // Estimated cost to goal
  parent: ActionNode | null;
}

interface Plan {
  goalId: string;
  actions: Action[]; // Stack: [MoveToTree, Chop, MoveToTable, Craft]
  totalCost: number;
  createdAt: number;
}
```

### 3. Economic Logic (The "Brain" of the Market)
When solving for `Obtain(Crate)`, the planner branches:
1.  **Path A (Craft)**:
    -   Need `Wood` -> `Chop` (Cost: Energy + Time).
    -   Need `Workstation` -> `Move` (Cost: Time).
    -   Action `Craft` (Cost: Time).
2.  **Path B (Buy)**:
    -   Need `Gold` -> `Sell(Berries)` (Cost: Inventory Loss).
    -   Action `Buy` (Cost: Gold + Market Availability Risk).

The NPC chooses the path with the lowest $W_{path}$.

### 4. Decision Audit (Debug UI)
-   Store the last calculated Plan and the "rejected" paths.
-   Expose an API endpoint `/debug/npc/:id/planning` to visualize the tree.

## Implementation Phases

### Phase 4.1: Foundation
-   Define `Goal`, `Action`, `State` interfaces.
-   Implement `ActionPlanner` (A* implementation).
-   Create basic Actions (`Move`, `Pickup`, `Eat`).

### Phase 4.2: Economic Actions
-   Implement `CraftAction` (recursive dependency resolution).
-   Implement `BuyAction` and `SellAction`.
-   Integrate with Quest Board.

### Phase 4.3: Goal Management
-   Implement `GoalManager` (Global vs. Local).
-   Connect Needs system to Goal generation (Hungry -> Generate `Eat` Goal).

### Phase 4.4: Optimization & UI
-   Time-slicing for performance.
-   Decision Audit UI implementation.
