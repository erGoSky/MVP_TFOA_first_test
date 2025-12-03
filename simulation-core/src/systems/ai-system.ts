import { NPC } from "../types";
import { WorldManager } from "../world";
import { MemorySystem } from "../ai/memory.system";
import { GoalManager } from "../ai/goal-manager";
import { GoalGenerator } from "../ai/goal-generator";
import { PlanExecutor } from "../ai/plan-executor";
import { APIService } from "../services/api-service";

/**
 * Manages NPC AI decision-making and action execution.
 *
 * The AISystem coordinates memory updates, goal management, plan execution,
 * and communication with the Python AI service for action planning.
 *
 * @example
 * ```typescript
 * const aiSystem = new AISystem();
 * await aiSystem.update(npc, world, currentTick);
 * ```
 */
export class AISystem {
  private memorySystem: MemorySystem;
  private goalManager: GoalManager;

  constructor() {
    this.memorySystem = new MemorySystem();
    this.goalManager = new GoalManager();
  }

  /**
   * Updates NPC AI for a single tick.
   *
   * Process:
   * 1. Update memory with observed entities
   * 2. Execute active actions if in progress
   * 3. Continue plan execution if plan exists
   * 4. Generate new goals and request plans from AI service
   *
   * @param npc - NPC to update
   * @param world - World manager instance
   * @param tick - Current simulation tick
   */
  public async update(npc: NPC, world: WorldManager, tick: number) {
    // 1. Update Memory
    // Accessing entityManager via world (assuming public access or getter)
    this.memorySystem.updateMemory(npc, world.entityManager.getAllEntities(), tick);

    // 2. Handle Active Action
    if (npc.actionState.inProgress) {
      const elapsed = tick - npc.actionState.startTime;
      if (elapsed >= npc.actionState.duration) {
        if (npc.currentAction) {
          // Execute action via World's ActionManager (or direct if exposed)
          // We need to access actionManager. Currently it's private in WorldManager.
          // We should expose it or add a method executeAction on WorldManager.
          // For now, assuming we'll add a getter or public property.
          // world.actionManager.executeAction(npc, npc.currentAction, world);

          // Better: world.executeAction(npc, npc.currentAction);
          // But let's assume we make actionManager public for systems.
          (world as any).actionManager.executeAction(npc, npc.currentAction, world);

          PlanExecutor.completeAction(npc, world);
        }
      }
      return;
    }

    // 3. Check Plan Status
    if (PlanExecutor.hasActivePlan(npc)) {
      PlanExecutor.startNextAction(npc, world);
      return;
    }

    // 4. Goal Management
    const state = world.getState() as unknown as import("../types").WorldState;
    const newGoals = GoalGenerator.generateGoals(npc, state, tick);
    newGoals.forEach((goal) => this.goalManager.addGoal(npc.id, goal));

    const activeGoal = this.goalManager.getNextGoal(npc.id);

    if (activeGoal) {
      // Throttling: Check if we requested a plan recently
      const lastRequest = npc.lastPlanRequestTick || 0;
      if (tick - lastRequest < 100) {
        // Too soon, skip this tick
        return;
      }

      // 5. Request Plan from Python AI
      try {
        const observationRadius = Math.min(20, 5 + (npc.skills.observation || 0));
        const nearbyEntities = world.entityManager.getEntitiesInRange(
          npc.position,
          observationRadius
        );

        const plan = await APIService.requestPlan(npc, activeGoal, nearbyEntities, state);

        if (plan && plan.length > 0) {
          npc.actionPlan = {
            actions: plan,
            currentIndex: 0,
          };
          npc.lastPlanRequestTick = tick;
          console.log(`📋 ${npc.name} received plan: ${plan.join(" -> ")}`);
        } else {
          console.log(`❌ ${npc.name} received empty plan for goal ${activeGoal.id}`);
          this.goalManager.abandonGoal(npc.id, "No valid plan found");
        }
      } catch (error) {
        console.error(`Failed to get plan for ${npc.name}:`, error);
        this.goalManager.abandonGoal(npc.id, "Plan request failed");
      }
    }
  }
}
