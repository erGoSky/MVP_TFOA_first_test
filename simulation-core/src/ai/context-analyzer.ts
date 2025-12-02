import { NPC, NPCContext, NPCContextState } from "../types";

/**
 * Analyzes NPC state to determine context for decision-making
 */
export class ContextAnalyzer {
  /**
   * Analyze NPC and return current context state
   */
  static analyzeNPC(npc: NPC): NPCContext {
    const state = this.determineState(npc);
    const urgentNeeds = this.getUrgentNeeds(npc);
    const opportunities = this.identifyOpportunities(npc);

    return { state, urgentNeeds, opportunities };
  }

  /**
   * Determine overall NPC state based on needs and resources
   */
  private static determineState(npc: NPC): NPCContextState {
    const criticalHunger = npc.needs.hunger > 0.9;
    const criticalEnergy = npc.needs.energy < 0.1;
    const lowHealth = npc.stats.health < 30;
    const lowMoney = npc.stats.money < 5;

    // DESPERATE: Critical survival needs + no resources
    if ((criticalHunger || criticalEnergy || lowHealth) && lowMoney) {
      return NPCContextState.DESPERATE;
    }

    // STRUGGLING: One or more needs are high
    const highHunger = npc.needs.hunger > 0.7;
    const lowEnergy = npc.needs.energy < 0.3;
    const poorHealth = npc.stats.health < 50;

    if (highHunger || lowEnergy || poorHealth || lowMoney) {
      return NPCContextState.STRUGGLING;
    }

    // THRIVING: All needs met + surplus resources
    const wellFed = npc.needs.hunger < 0.3;
    const wellRested = npc.needs.energy > 0.7;
    const healthy = npc.stats.health >= 80;
    const wealthy = npc.stats.money >= 100;

    if (wellFed && wellRested && healthy && wealthy) {
      return NPCContextState.THRIVING;
    }

    // STABLE: Default balanced state
    return NPCContextState.STABLE;
  }

  /**
   * Identify which needs are urgent
   */
  private static getUrgentNeeds(npc: NPC): string[] {
    const urgent: string[] = [];

    if (npc.needs.hunger > 0.7) {
      urgent.push("hunger");
    }
    if (npc.needs.energy < 0.3) {
      urgent.push("energy");
    }
    if (npc.stats.health < 50) {
      urgent.push("health");
    }
    if (npc.stats.money < 10) {
      urgent.push("money");
    }

    return urgent;
  }

  /**
   * Identify opportunities available to NPC
   */
  private static identifyOpportunities(npc: NPC): string[] {
    const opportunities: string[] = [];

    // Has money to invest
    if (npc.stats.money >= 100) {
      opportunities.push("can_build_house");
      opportunities.push("can_invest");
    }

    // Has surplus resources
    const totalInventory = npc.inventory.reduce((sum, item) => sum + item.quantity, 0);
    if (totalInventory > 10) {
      opportunities.push("can_trade_surplus");
    }

    // High skills
    if (npc.skills.crafting > 50) {
      opportunities.push("can_craft_advanced");
    }
    if (npc.skills.trading > 50) {
      opportunities.push("can_negotiate_better");
    }

    // Well-rested and healthy
    if (npc.needs.energy > 0.8 && npc.stats.health > 80) {
      opportunities.push("can_explore");
      opportunities.push("can_work_hard");
    }

    return opportunities;
  }
}
