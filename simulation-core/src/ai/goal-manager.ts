/**
 * Goal Management System
 * 
 * Manages NPC goals with dual-queue system (global + local).
 * Goals are stored in TypeScript, Python AI service only does planning.
 */

export enum GoalType {
    MAINTAIN_NEED = 'maintain_need',
    OBTAIN_ITEM = 'obtain_item',
    REACH_SKILL = 'reach_skill',
    ACCUMULATE_WEALTH = 'accumulate_wealth',
    BUILD_STRUCTURE = 'build_structure',
    COMPLETE_ORDER = 'complete_order',
    SOCIALIZE = 'socialize',
    LEARN = 'learn'
}

export interface StateCondition {
    type: string;  // 'has_item', 'near_location', 'skill_level', 'stat_value'
    key: string;   // Item name, location ID, skill name, stat name
    value: any;    // Required value
    operator: '==' | '>=' | '<=' | '>' | '<';
}

export interface Goal {
    id: string;
    type: GoalType;
    priority: number;  // Base priority (0-1)
    conditions: StateCondition[];
    isGlobal: boolean;  // Global (long-term) vs Local (immediate)
    deadline?: number;  // Tick deadline
    createdAt: number;  // Tick when created
}

export interface NPCGoals {
    active: Goal | null;
    globalQueue: Goal[];
    localQueue: Goal[];
}

export class GoalManager {
    private npcGoals: Map<string, NPCGoals> = new Map();

    /**
     * Initialize goals for an NPC
     */
    initializeNPC(npcId: string): void {
        if (!this.npcGoals.has(npcId)) {
            this.npcGoals.set(npcId, {
                active: null,
                globalQueue: [],
                localQueue: []
            });
        }
    }

    /**
     * Add a goal to NPC's queue
     */
    addGoal(npcId: string, goal: Goal): void {
        this.initializeNPC(npcId);
        const goals = this.npcGoals.get(npcId)!;

        if (goal.isGlobal) {
            goals.globalQueue.push(goal);
            goals.globalQueue.sort((a, b) => b.priority - a.priority);
        } else {
            goals.localQueue.push(goal);
            goals.localQueue.sort((a, b) => b.priority - a.priority);
        }
    }

    /**
     * Get next goal for NPC (prioritizes local over global)
     */
    getNextGoal(npcId: string): Goal | null {
        this.initializeNPC(npcId);
        const goals = this.npcGoals.get(npcId)!;

        // Check if there's an active goal
        if (goals.active) {
            return goals.active;
        }

        // Prioritize local goals (immediate needs)
        if (goals.localQueue.length > 0) {
            goals.active = goals.localQueue.shift()!;
            return goals.active;
        }

        // Fall back to global goals (long-term)
        if (goals.globalQueue.length > 0) {
            goals.active = goals.globalQueue.shift()!;
            return goals.active;
        }

        return null;
    }

    /**
     * Mark current goal as complete
     */
    completeGoal(npcId: string): void {
        const goals = this.npcGoals.get(npcId);
        if (goals) {
            goals.active = null;
        }
    }

    /**
     * Abandon current goal
     */
    abandonGoal(npcId: string, reason: string): void {
        const goals = this.npcGoals.get(npcId);
        if (goals && goals.active) {
            console.log(`NPC ${npcId} abandoned goal ${goals.active.id}: ${reason}`);
            goals.active = null;
        }
    }

    /**
     * Calculate priority with urgency and personality modifiers
     */
    calculatePriority(
        basePriority: number,
        urgencyMultiplier: number,
        personalityModifier: number
    ): number {
        return basePriority * urgencyMultiplier * personalityModifier;
    }

    /**
     * Check if goal should be abandoned (too expensive, unreachable, expired)
     */
    shouldAbandon(goal: Goal, currentTick: number): boolean {
        // Check deadline
        if (goal.deadline && currentTick > goal.deadline) {
            return true;
        }

        // Check if goal is too old (stale)
        const age = currentTick - goal.createdAt;
        if (age > 1000) {  // 1000 ticks without completion
            return true;
        }

        return false;
    }

    /**
     * Get all goals for an NPC (for debugging)
     */
    getGoals(npcId: string): NPCGoals | null {
        return this.npcGoals.get(npcId) || null;
    }

    /**
     * Clear all goals for an NPC
     */
    clearGoals(npcId: string): void {
        this.npcGoals.delete(npcId);
    }
}
