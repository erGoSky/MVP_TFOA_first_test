import { ActionHandler } from '../action-manager';
import { NPC, Entity, Container, InventoryItem } from '../../types';
import { WorldManager } from '../../world';

export class StorageHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        // Target could be a building or a standalone entity with a container
        let target: Entity | undefined = state.buildings[targetId] || state.entities[targetId];
        
        // If not found, check if it's a resource (unlikely to be a container, but for safety)
        if (!target) target = state.resources[targetId];

        if (!target || !target.container) {
            console.log(`${npc.name} failed to ${actionType}: Target ${targetId} is not a container.`);
            world.resetAction(npc);
            return;
        }

        if (world.getDistance(npc.position, target.position) > 1.5) {
            console.log(`${npc.name} failed to ${actionType}: Too far from target.`);
            world.resetAction(npc);
            return;
        }

        const container = target.container;

        if (actionType === 'store_item') {
            this.handleStoreItem(npc, container);
        } else if (actionType === 'retrieve_item') {
            this.handleRetrieveItem(npc, container, world);
        }

        world.resetAction(npc);
    }

    private handleStoreItem(npc: NPC, container: Container): void {
        // 1. Try to store item in hands first
        if (npc.hands) {
            this.addItemToContainer(container, npc.hands);
            console.log(`${npc.name} stored ${npc.hands.type} in container.`);
            npc.hands = null;
            return;
        }

        // 2. If hands empty, try to store first item from inventory
        if (npc.inventory.length > 0) {
            const item = npc.inventory.shift();
            if (item) {
                this.addItemToContainer(container, item);
                console.log(`${npc.name} stored ${item.type} from inventory in container.`);
            }
        } else {
            console.log(`${npc.name} has nothing to store.`);
        }
    }

    private handleRetrieveItem(npc: NPC, container: Container, world: WorldManager): void {
        if (container.contents.length === 0) {
            console.log(`${npc.name} failed to retrieve: Container is empty.`);
            return;
        }

        // Simple logic: Take the last item added (LIFO) or first? Let's take first.
        const item = container.contents.shift();
        if (item) {
            // Try to put in hands first
            if (!npc.hands) {
                npc.hands = item;
                console.log(`${npc.name} retrieved ${item.type} into hands.`);
            } else {
                // Put in inventory
                world.addToInventory(npc, item.type, item.quantity);
                console.log(`${npc.name} retrieved ${item.type} into inventory.`);
            }
        }
    }

    private addItemToContainer(container: Container, item: InventoryItem): void {
        // Check if item of same type exists to stack
        const existing = container.contents.find(i => i.type === item.type);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            container.contents.push(item);
        }
    }
}
