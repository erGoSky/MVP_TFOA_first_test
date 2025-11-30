import { WorkProgress, WorkContributor, Resource, Building, NPC } from './types';

export class WorkManager {
    /**
     * Initialize work on an entity if not already started
     */
    static initializeWork(
        entity: Resource | Building,
        actionType: string,
        baseProgressPerTick: number
    ): void {
        if (!entity.workProgress) {
            entity.workProgress = {
                currentProgress: 0,
                requiredProgress: 100,
                actionType,
                contributors: [],
                baseProgressPerTick
            };
        }
    }

    /**
     * Add NPC contribution to work progress
     * Formula: progress += (skill / 100) * baseProgressPerTick
     */
    static contributeToWork(
        entity: Resource | Building,
        npc: NPC,
        skill: number,
        currentTick: number
    ): { completed: boolean; progress: number } {
        if (!entity.workProgress) {
            throw new Error('Work not initialized on entity');
        }

        const progress = entity.workProgress;
        
        // Calculate contribution based on skill
        const contribution = (skill / 100) * progress.baseProgressPerTick;
        progress.currentProgress = Math.min(100, progress.currentProgress + contribution);

        // Track contributor
        let contributor = progress.contributors.find(c => c.npcId === npc.id);
        if (!contributor) {
            contributor = {
                npcId: npc.id,
                lastContribution: currentTick,
                totalContribution: 0
            };
            progress.contributors.push(contributor);
        }

        contributor.lastContribution = currentTick;
        contributor.totalContribution += contribution;

        // Last contributor gets the reward
        progress.lastContributorId = npc.id;

        const completed = progress.currentProgress >= progress.requiredProgress;

        return {
            completed,
            progress: progress.currentProgress
        };
    }

    /**
     * Complete the work and return the last contributor ID
     */
    static completeWork(entity: Resource | Building): string | undefined {
        if (!entity.workProgress) return undefined;

        const lastContributor = entity.workProgress.lastContributorId;
        
        // Clean up work progress
        delete entity.workProgress;

        return lastContributor;
    }

    /**
     * Check if entity has work in progress of specific type
     */
    static hasWorkInProgress(
        entity: Resource | Building,
        actionType?: string
    ): boolean {
        if (!entity.workProgress) return false;
        if (actionType && entity.workProgress.actionType !== actionType) return false;
        return true;
    }

    /**
     * Get current work progress percentage
     */
    static getProgress(entity: Resource | Building): number {
        return entity.workProgress?.currentProgress || 0;
    }

    /**
     * Interrupt work (progress is saved on entity)
     */
    static interruptWork(npc: NPC): void {
        // Work progress stays on the entity, so nothing to do here
        // This method exists for future functionality if needed
    }
}
