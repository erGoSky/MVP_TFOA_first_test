/**
 * Goal Generator
 *
 * Automatically generates goals for NPCs based on their needs and context.
 */

import { NPC, WorldState } from "../types";
import { Goal, GoalType, StateCondition } from "./goal-manager";
import { ContextAnalyzer } from "./context-analyzer";
import { NPCContextState } from "../types";

export class GoalGenerator {
  /**
   * Generate goals from NPC needs
   */
  static generateFromNeeds(npc: NPC, worldState: WorldState, currentTick: number): Goal[] {
    const goals: Goal[] = [];

    // Hunger goal
    if (npc.needs.hunger > 0.7) {
      goals.push({
        id: `eat_${npc.id}_${currentTick}`,
        type: GoalType.MAINTAIN_NEED,
        priority: 0.9,
        conditions: [{ type: "stat_value", key: "hunger", value: 0.3, operator: "<=" }],
        isGlobal: false,
        createdAt: currentTick,
      });
    }

    // Energy goal
    if (npc.needs.energy < 0.3) {
      goals.push({
        id: `sleep_${npc.id}_${currentTick}`,
        type: GoalType.MAINTAIN_NEED,
        priority: 0.85,
        conditions: [{ type: "stat_value", key: "energy", value: 0.8, operator: ">=" }],
        isGlobal: false,
        createdAt: currentTick,
      });
    }

    // Health goal
    if (npc.stats.health < 50) {
      goals.push({
        id: `heal_${npc.id}_${currentTick}`,
        type: GoalType.MAINTAIN_NEED,
        priority: 0.95,
        conditions: [{ type: "stat_value", key: "health", value: 80, operator: ">=" }],
        isGlobal: false,
        createdAt: currentTick,
      });
    }

    // Money goal (if poor)
    if (npc.stats.money < 10) {
      goals.push({
        id: `earn_money_${npc.id}_${currentTick}`,
        type: GoalType.ACCUMULATE_WEALTH,
        priority: 0.6,
        conditions: [{ type: "stat_value", key: "money", value: 50, operator: ">=" }],
        isGlobal: true,
        createdAt: currentTick,
      });
    }

    return goals;
  }

  /**
   * Generate context-aware goals based on NPC state
   */
  static generateContextGoals(npc: NPC, worldState: WorldState, currentTick: number): Goal[] {
    const context = ContextAnalyzer.analyzeNPC(npc);
    const goals: Goal[] = [];

    switch (context.state) {
      case NPCContextState.DESPERATE:
        // Focus on survival
        if (npc.needs.hunger > 0.8) {
          goals.push({
            id: `desperate_food_${npc.id}_${currentTick}`,
            type: GoalType.OBTAIN_ITEM,
            priority: 1.0,
            conditions: [{ type: "has_item", key: "food", value: 1, operator: ">=" }],
            isGlobal: false,
            createdAt: currentTick,
          });
        }
        break;

      case NPCContextState.THRIVING:
        // Pursue ambitions
        if (npc.stats.money >= 100 && npc.ownedBuildingIds.length === 0) {
          goals.push({
            id: `build_house_${npc.id}_${currentTick}`,
            type: GoalType.BUILD_STRUCTURE,
            priority: 0.7,
            conditions: [{ type: "owns_building", key: "house", value: true, operator: "==" }],
            isGlobal: true,
            deadline: currentTick + 500,
            createdAt: currentTick,
          });
        }
        break;

      case NPCContextState.STABLE:
        // Improve skills or accumulate resources
        if (npc.skills.crafting < 50) {
          goals.push({
            id: `improve_crafting_${npc.id}_${currentTick}`,
            type: GoalType.REACH_SKILL,
            priority: 0.5,
            conditions: [{ type: "skill_level", key: "crafting", value: 50, operator: ">=" }],
            isGlobal: true,
            createdAt: currentTick,
          });
        }
        break;
    }

    // Opportunity-based goals
    const totalInventory = npc.inventory.reduce((sum, item) => sum + item.quantity, 0);
    if (totalInventory > 10) {
      goals.push({
        id: `sell_surplus_${npc.id}_${currentTick}`,
        type: GoalType.ACCUMULATE_WEALTH,
        priority: 0.4,
        conditions: [{ type: "inventory_count", key: "total", value: 5, operator: "<=" }],
        isGlobal: false,
        createdAt: currentTick,
      });
    }

    return goals;
  }

  /**
   * Generate all applicable goals for an NPC
   */
  static generateGoals(npc: NPC, worldState: WorldState, currentTick: number): Goal[] {
    const needsGoals = this.generateFromNeeds(npc, worldState, currentTick);
    const contextGoals = this.generateContextGoals(npc, worldState, currentTick);

    return [...needsGoals, ...contextGoals];
  }
}
