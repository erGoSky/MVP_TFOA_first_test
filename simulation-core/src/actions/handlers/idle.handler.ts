import { ActionHandler } from '../action-manager';
import { NPC } from '../../types';
import { WorldManager } from '../../world';

export class IdleHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        
        if (!npc.actionState.inProgress) {
            // Start idling
            npc.actionState.inProgress = true;
            npc.actionState.startTime = state.tick;
            npc.actionState.duration = 24; // Wait 24 ticks
            console.log(`${npc.name} is idling for 24 ticks.`);
        } else {
            // Finished idling
            console.log(`${npc.name} finished idling.`);
            world.resetAction(npc);
        }
    }
}
