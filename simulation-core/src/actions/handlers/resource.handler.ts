import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';
import { TOOL_DEGRADATION } from '../../constants/items';

export class ResourceHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        const resource = state.resources[targetId];

        if (actionType === 'chop') {
             if (resource && resource.resourceType.includes('tree') && world.getDistance(npc.position, resource.position) <= 1.5) {
                 world.addToInventory(npc, 'wood', 2);
                 resource.amount -= 5;
                 if (resource.amount <= 0) {
                     world.removeEntity(targetId);
                 }
                 console.log(`${npc.name} chopped wood.`);
                 npc.skills.gathering = Math.min(100, npc.skills.gathering + 3);
                 
                 this.degradeTool(npc, 'axe', TOOL_DEGRADATION.CHOP);
             }
             world.resetAction(npc);
        }
        else if (actionType === 'mine') {
             if (resource && (resource.resourceType.includes('rock') || resource.resourceType.includes('ore')) && world.getDistance(npc.position, resource.position) <= 1.5) {
                 // Determine drop based on resource type
                 const dropType = resource.resourceType === 'rock_stone' ? 'stone' : 
                                  resource.resourceType === 'ore_iron' ? 'ore_iron' : 
                                  resource.resourceType === 'ore_coal' ? 'ore_coal' : 'stone';
                                  
                 world.addToInventory(npc, dropType, 2);
                 resource.amount -= 5;
                 if (resource.amount <= 0) {
                     world.removeEntity(targetId);
                 }
                 console.log(`${npc.name} mined ${dropType}.`);
                 npc.skills.gathering = Math.min(100, npc.skills.gathering + 3);
                 
                 this.degradeTool(npc, 'pickaxe', TOOL_DEGRADATION.MINE);
             }
             world.resetAction(npc);
        }
    }

    private degradeTool(npc: NPC, toolType: string, amount: number) {
        // Find best tool of type
        const tool = npc.inventory.find(i => i.type.includes(toolType) && i.properties?.durability);
        
        if (tool && tool.properties && tool.properties.durability) {
            tool.properties.durability -= amount;
            if (tool.properties.durability <= 0) {
                console.log(`${npc.name}'s ${tool.type} broke!`);
                npc.inventory = npc.inventory.filter(i => i !== tool);
            }
        }
    }
}
