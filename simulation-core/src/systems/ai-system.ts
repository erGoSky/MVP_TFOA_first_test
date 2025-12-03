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
          // Execute action via World's ActionManager
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

        // Use MemorySystem to get valid (non-forgotten) memories + currently visible entities
        // For the AI request, we want "what does the NPC know about?"
        // This includes valid memories AND currently visible things (which are also in memory now)
        const validMemories = this.memorySystem.getValidMemories(npc);

        // We need to map memories back to a format the AI understands if it expects full entities
        // But the API service expects "nearby_entities".
        // Let's send the valid memories as the "nearby_entities" context,
        // but we might need to enrich them with current data if they are visible.
        // For now, let's stick to the previous behavior of sending "entities in range"
        // BUT filtered by what the NPC *should* perceive/remember.
        // Actually, the requirement is: "Exclude from AI decision making" if forgotten.
        // So we should send valid memories.

        // Construct a simplified list of entities from memory for the AI
        const memoryContext = validMemories.map((m) => ({
          id: m.id,
          type: m.type,
          subtype: m.subtype,
          position: m.position,
          interaction_count: m.interactionCount, // Send interaction count
          // Add other props if needed by AI
        }));

        const plan = await APIService.requestPlan(npc, activeGoal, memoryContext, state);

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
          this.handlePlanningFailure(npc, world, tick);
        }
      } catch (error) {
        console.error(`Failed to get plan for ${npc.name}:`, error);
        this.goalManager.abandonGoal(npc.id, "Plan request failed");
        this.handlePlanningFailure(npc, world, tick);
      }
    } else {
      // No active goal? Maybe fallback too?
      // For now, only fallback on plan failure.
    }
  }

  /**
   * Handles cases where AI planning fails by triggering a fallback behavior.
   *
   * Strategy:
   * 1. Visual Exploration: Walk to the farthest visible object.
   * 2. Wander: If nothing visible, walk to a random nearby spot.
   */
  private handlePlanningFailure(npc: NPC, world: WorldManager, tick: number) {
    // Throttling for fallback to prevent spamming
    const lastFallback = npc.lastFallbackTick || 0;
    if (tick - lastFallback < 20) return;

    npc.lastFallbackTick = tick;
    console.log(`⚠️ ${npc.name} initiating fallback behavior...`);

    // Strategy 1: Visual Exploration (Farthest Visible/Remembered)
    const validMemories = this.memorySystem.getValidMemories(npc);

    if (validMemories.length > 0) {
      // Filter out self and sort by distance descending
      const candidates = validMemories
        .filter((m) => m.id !== npc.id)
        .sort((a, b) => {
          const distA = world.getDistance(npc.position, a.position);
          const distB = world.getDistance(npc.position, b.position);
          return distB - distA; // Descending
        });

      if (candidates.length > 0) {
        const target = candidates[0];
        console.log(
          `🔭 ${npc.name} fallback: Exploring towards ${target.subtype} at (${target.position.x}, ${target.position.y})`
        );

        // Create a move action
        // Note: The move handler should handle "just moving" without a specific interaction target
        npc.currentAction = `move(${target.position.x},${target.position.y})`;
        npc.actionState = {
          inProgress: true,
          startTime: tick,
          duration: Math.ceil(world.getDistance(npc.position, target.position) / npc.stats.speed),
        };
        return;
      }
    }

    // Strategy 2: Wander (Random nearby)
    const range = 5;
    const dx = Math.floor(Math.random() * (range * 2 + 1)) - range;
    const dy = Math.floor(Math.random() * (range * 2 + 1)) - range;
    const targetX = Math.max(0, Math.min(99, npc.position.x + dx));
    const targetY = Math.max(0, Math.min(99, npc.position.y + dy));

    console.log(`🎲 ${npc.name} fallback: Wandering to (${targetX}, ${targetY})`);

    npc.currentAction = `move(${targetX},${targetY})`;
    npc.actionState = {
      inProgress: true,
      startTime: tick,
      duration: Math.ceil(
        world.getDistance(npc.position, { x: targetX, y: targetY }) / npc.stats.speed
      ),
    };
  }
}
