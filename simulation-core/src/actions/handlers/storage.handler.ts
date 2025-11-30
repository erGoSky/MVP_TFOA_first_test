import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';

export class StorageHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();

        if (actionType === 'store') {
            const [containerId, itemType] = targetId.split('|');
            const container = state.buildings[containerId];
            
            if (container && world.getDistance(npc.position, container.position) <= 1.5) {
                // Find item in inventory or hands
                let item = npc.inventory.find(i => i.type === itemType);
                let source = 'inventory';
                
                if (!item && npc.hands?.type === itemType) {
                    item = npc.hands;
                    source = 'hands';
                }
                
                if (item) {
                    // Add to container
                    const existing = container.inventory.find(i => i.type === itemType);
                    if (existing) {
                        existing.quantity += 1; // Store 1 at a time?
                    } else {
                        container.inventory.push({ id: `item_${Date.now()}`, type: itemType, quantity: 1 });
                    }
                    
                    // Remove from source
                    item.quantity -= 1;
                    if (item.quantity <= 0) {
                        if (source === 'inventory') {
                            npc.inventory = npc.inventory.filter(i => i !== item);
                        } else {
                            npc.hands = null;
                        }
                    }
                    console.log(`${npc.name} stored ${itemType} in ${container.buildingType}.`);
                } else {
                    console.log(`${npc.name} has no ${itemType} to store.`);
                }
            } else {
                console.log(`${npc.name} cannot store (too far or missing container).`);
            }
            world.resetAction(npc);
        }
        else if (actionType === 'retrieve') {
            const [containerId, itemType] = targetId.split('|');
            const container = state.buildings[containerId];
            
            if (container && world.getDistance(npc.position, container.position) <= 1.5) {
                const item = container.inventory.find(i => i.type === itemType);
                if (item && item.quantity > 0) {
                    // Add to NPC
                    // Check logic (hands/inventory) - simplified: add to inventory
                    world.addToInventory(npc, itemType, 1);
                    
                    item.quantity -= 1;
                    if (item.quantity <= 0) {
                        container.inventory = container.inventory.filter(i => i !== item);
                    }
                    console.log(`${npc.name} retrieved ${itemType} from ${container.buildingType}.`);
                } else {
                    console.log(`${container.buildingType} has no ${itemType}.`);
                }
            }
            world.resetAction(npc);
        }
    }
}
