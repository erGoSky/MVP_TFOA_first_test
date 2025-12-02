import { NPC } from "../types";
import { WorldManager } from "../world";
import { MemorySystem } from "../ai/memory.system";
import { GoalManager } from "../ai/goal-manager";
import { GoalGenerator } from "../ai/goal-generator";
import { PlanExecutor } from "../ai/plan-executor";
import { APIService } from "../services/api-service";

export class AISystem {
  private memorySystem: MemorySystem;
  private goalManager: GoalManager;

  constructor() {
    this.memorySystem = new MemorySystem();
    this.goalManager = new GoalManager();
  }

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
    const state = world.getState();
    const newGoals = GoalGenerator.generateGoals(npc, state, tick);
    newGoals.forEach((goal) => this.goalManager.addGoal(npc.id, goal));

    const activeGoal = this.goalManager.getNextGoal(npc.id);

    if (activeGoal) {
      console.log(`🎯 ${npc.name} pursuing goal: ${activeGoal.type} (${activeGoal.id})`);

      const worldStateForAI = this.getWorldStateForAI(world);
      const plan = await APIService.requestPlan(npc, activeGoal, worldStateForAI);

      if (plan && plan.length > 0) {
        console.log(`📝 Plan received for ${npc.name}: ${plan.join(" -> ")}`);
        npc.actionPlan = { actions: plan, currentIndex: 0 };
        PlanExecutor.startNextAction(npc, world);
      } else {
        console.log(`⚠️ No plan found for goal ${activeGoal.id}, abandoning.`);
        this.goalManager.abandonGoal(npc.id, "No plan found");
        this.setIdle(npc, tick);
      }
    } else {
      this.setIdle(npc, tick);
    }
  }

  private setIdle(npc: NPC, tick: number) {
    npc.currentAction = "idle";
    npc.actionState = { inProgress: true, startTime: tick, duration: 10 };
  }

  private getWorldStateForAI(world: WorldManager) {
    const state = world.getState();
    return {
      time: state.time,
      resources: Object.values(state.resources).map((r) => ({
        id: r.id,
        type: r.resourceType,
        position: r.position,
        amount: r.amount,
      })),
      buildings: Object.values(state.buildings).map((b) => ({
        id: b.id,
        type: b.buildingType,
        position: b.position,
      })),
    };
  }

  public addGoal(npcId: string, goal: any) {
    this.goalManager.addGoal(npcId, goal);
  }
}
