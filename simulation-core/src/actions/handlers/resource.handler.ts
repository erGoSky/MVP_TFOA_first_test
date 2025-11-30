import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';

export class ResourceHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        const resource = state.resources[targetId];

        if (actionType === 'chop') {
             if (resource && resource.type.includes('tree') && world.getDistance(npc.position, resource.position) <= 1.5) {
                 world.addToInventory(npc, 'wood', 2);
                 resource.amount -= 5; // Trees have more health?
                 if (resource.amount <= 0) delete state.resources[targetId];
                 console.log(`${npc.name} chopped wood.`);
                 npc.skills.gathering = Math.min(100, npc.skills.gathering + 3);
             }
             world.resetAction(npc);
        }
        else if (actionType === 'mine') {
             if (resource && resource.type.includes('rock') && world.getDistance(npc.position, resource.position) <= 1.5) {
                 world.addToInventory(npc, 'stone', 2);
                 resource.amount -= 5;
                 if (resource.amount <= 0) delete state.resources[targetId];
                 console.log(`${npc.name} mined stone.`);
                 npc.skills.gathering = Math.min(100, npc.skills.gathering + 3);
             }
             world.resetAction(npc);
        }
    }
}
