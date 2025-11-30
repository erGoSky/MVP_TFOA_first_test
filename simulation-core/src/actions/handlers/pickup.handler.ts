import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';
import { getItemDefinition } from '../../data/item-definitions';

export class PickupHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        const resource = state.resources[targetId];
        
        if (resource && world.getDistance(npc.position, resource.position) <= 1.5) {
            const itemDef = getItemDefinition(resource.resourceType);
            const category = itemDef?.category || 'small'; // Default to small

            // Logic based on category
            let success = false;
            let reason = '';

            if (category === 'liquid') {
                // Requires empty container in hands
                if (npc.hands && npc.hands.type.includes('bucket') && !npc.hands.contents?.length) {
                    // Fill bucket
                    npc.hands.contents = [{ id: `fluid_${Date.now()}`, type: resource.resourceType, quantity: 10 }]; // Assume full bucket
                    success = true;
                } else {
                    reason = 'Needs empty bucket in hands';
                }
            } else if (category === 'bulky') {
                // Requires empty hands
                if (!npc.hands) {
                    npc.hands = { 
                        id: `item_${Date.now()}`, 
                        type: resource.resourceType, 
                        quantity: 1,
                        category: 'bulky',
                        properties: itemDef?.properties
                    };
                    success = true;
                } else {
                    reason = 'Hands are full';
                }
            } else if (category === 'loose') {
                // Loose items need a sack if quantity > 3
                const currentCount = npc.inventory.filter(i => i.type === resource.resourceType).reduce((sum, i) => sum + i.quantity, 0);
                const pickupAmount = 1; // Default pickup amount
                
                if (currentCount + pickupAmount > 3) {
                    // Check for sack
                    const sack = npc.inventory.find(i => i.type === 'sack') || (npc.hands?.type === 'sack' ? npc.hands : null);
                    if (sack) {
                        // Add to sack
                        if (!sack.contents) sack.contents = [];
                        const itemInSack = sack.contents.find(i => i.type === resource.resourceType);
                        if (itemInSack) itemInSack.quantity += pickupAmount;
                        else sack.contents.push({ id: `item_${Date.now()}`, type: resource.resourceType, quantity: pickupAmount });
                        success = true;
                    } else {
                        reason = 'Need a sack to hold more loose items';
                    }
                } else {
                    world.addToInventory(npc, resource.resourceType, pickupAmount);
                    success = true;
                }
            } else {
                // Small: Go to inventory
                world.addToInventory(npc, resource.resourceType, 1);
                success = true;
            }

            if (success) {
                resource.amount -= 1;
                if (resource.amount <= 0) {
                    delete state.resources[targetId];
                }
                console.log(`${npc.name} picked up ${resource.resourceType}.`);
                npc.skills.gathering = Math.min(100, npc.skills.gathering + 2);
            } else {
                console.log(`${npc.name} failed to pickup ${resource.resourceType}: ${reason}`);
            }
        } else {
            console.log(`${npc.name} failed to pickup (too far or missing).`);
        }
        world.resetAction(npc);
    }
}
