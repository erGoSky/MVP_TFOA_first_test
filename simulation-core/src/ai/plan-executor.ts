/**
 * Plan Executor
 *
 * Executes action plans tick-by-tick with duration calculation.
 * Stores plan in NPC state and executes actions sequentially.
 */

import { NPC } from "../types";
import { ActionManager } from "../actions/action-manager";
import type { WorldManager } from "../world";

export interface ActionPlan {
  actions: string[]; // Action names from Python planner
  currentIndex: number;
}

export class PlanExecutor {
  /**
   * Start executing the next action in the plan
   */
  static startNextAction(npc: NPC, world: WorldManager): void {
    if (!npc.actionPlan || npc.actionPlan.currentIndex >= npc.actionPlan.actions.length) {
      // Plan complete or no plan
      npc.actionPlan = undefined;
      npc.currentAction = null;
      return;
    }

    const actionName = npc.actionPlan.actions[npc.actionPlan.currentIndex];

    // Validate preconditions (simplified - would need full validation)
    // For now, just set the action
    npc.currentAction = actionName;

    // Calculate tick duration based on action type and NPC stats
    const duration = this.calculateActionDuration(actionName, npc);

    // Set action state
    npc.actionState = {
      inProgress: true,
      startTime: world.getState().tick,
      duration: duration,
    };

    console.log(`🎬 ${npc.name} starting action: ${actionName} (${duration} ticks)`);
  }

  /**
   * Complete current action and move to next
   */
  static completeAction(npc: NPC, world: WorldManager): void {
    if (!npc.actionPlan) return;

    const actionName = npc.actionPlan.actions[npc.actionPlan.currentIndex];
    console.log(`✅ ${npc.name} completed action: ${actionName}`);

    // Action will be executed by ActionManager in WorldManager.updateNPC()

    // Move to next action
    npc.actionPlan.currentIndex++;

    // Reset action state
    npc.actionState = {
      inProgress: false,
      startTime: 0,
      duration: 0,
    };
  }

  /**
   * Calculate how many ticks an action will take
   */
  static calculateActionDuration(actionName: string, npc: NPC): number {
    const [actionType, ...params] = actionName.split(":");

    // Base durations per action type
    const baseDurations: Record<string, number> = {
      move: 5,
      pickup: 2,
      chop: 10,
      mine: 12,
      gather: 5,
      hunt: 15,
      farm: 20,
      craft: 15,
      process: 10,
      repair: 8,
      buy: 3,
      sell: 3,
      eat: 2,
      drink: 1,
      sleep: 30,
      work: 20,
      talk: 3,
      socialize: 10,
      learn: 25,
      teach: 20,
      attack: 3,
      heal: 5,
      store: 2,
      retrieve: 2,
      drop: 1,
      transfer: 2,
    };

    let baseDuration = baseDurations[actionType] || 5;

    // Apply skill modifiers
    let skillModifier = 1.0;

    if (["chop", "mine", "gather", "hunt", "farm"].includes(actionType)) {
      // Gathering actions - gathering skill reduces time
      const gatheringSkill = npc.skills.gathering || 0;
      skillModifier = 1.0 - gatheringSkill / 200; // Max 50% reduction at skill 100
    } else if (["craft", "process", "repair"].includes(actionType)) {
      // Crafting actions - crafting skill reduces time
      const craftingSkill = npc.skills.crafting || 0;
      skillModifier = 1.0 - craftingSkill / 200;
    } else if (["buy", "sell"].includes(actionType)) {
      // Trading actions - trading skill reduces time
      const tradingSkill = npc.skills.trading || 0;
      skillModifier = 1.0 - tradingSkill / 300; // Smaller effect
    }

    // Apply energy modifier (low energy = slower)
    const energyModifier = 0.5 + npc.needs.energy * 0.5; // 50% to 100% speed

    const finalDuration = Math.max(1, Math.round(baseDuration * skillModifier * energyModifier));

    return finalDuration;
  }

  /**
   * Check if NPC has an active plan
   */
  static hasActivePlan(npc: NPC): boolean {
    return (
      npc.actionPlan !== undefined && npc.actionPlan.currentIndex < npc.actionPlan.actions.length
    );
  }

  /**
   * Cancel current plan
   */
  static cancelPlan(npc: NPC): void {
    npc.actionPlan = undefined;
    npc.currentAction = null;
    npc.actionState = {
      inProgress: false,
      startTime: 0,
      duration: 0,
    };
  }
}
