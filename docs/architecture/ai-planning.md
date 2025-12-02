# AI Planning System (GOAP)

## Overview
The AI system uses **Goal-Oriented Action Planning (GOAP)** combined with Utility AI to create intelligent, autonomous NPCs.

## Core Concepts

### 1. Goals
Goals represent high-level objectives an NPC wants to achieve.
- **Types**: `MAINTAIN_NEED`, `OBTAIN_ITEM`, `REACH_SKILL`, `ACCUMULATE_WEALTH`.
- **Priority**: Calculated dynamically based on urgency and personality.
- **Lifecycle**: Generated -> Active -> Completed/Failed.

### 2. Actions
Atomic units of behavior that transform the world state.
- **Preconditions**: What must be true to perform the action (e.g., `has_wood: 1`).
- **Effects**: How the world changes (e.g., `has_wood: 0`, `has_plank: 1`).
- **Cost**: The "expense" of the action (time, energy, money).

### 3. Planning (A*)
The planner finds the cheapest sequence of actions to transform the **Current State** into the **Goal State**.

---

## Components

### Goal Manager
- Maintains a priority queue of goals.
- Handles goal generation based on needs (Hunger -> EatGoal).
- Manages goal abandonment (if impossible) and completion.

### Economic Planner
- Evaluates "Craft vs. Buy" decisions.
- **Craft Path**: Recursive check of materials, tools, and skills.
- **Buy Path**: Check market availability and price.
- **Decision**: Chooses the path with the best Utility (Time + Cost + Risk).

### Action Registry
- Central repository of all available actions.
- Supports dynamic action expansion (e.g., `move_to_X` for every resource).

---

## API Reference

### `POST /plan_action_enhanced`
Main entry point for decision making.

**Request:**
```json
{
  "npc_state": { ... },
  "world_state": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "plan": ["move_to_forest", "chop_wood", "move_to_home", "store_wood"],
  "goal": "accumulate_wealth"
}
```
