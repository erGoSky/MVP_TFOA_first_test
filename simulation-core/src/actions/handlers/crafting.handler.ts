import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';

export class CraftingHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();

        if (actionType === 'eat') {
            const item = npc.inventory.find(i => i.type === targetId);
            if (item) {
                npc.needs.hunger = Math.min(1, npc.needs.hunger + 0.3);
                npc.needs.energy = Math.min(1, npc.needs.energy + 0.1);
                
                // Consume item
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    npc.inventory = npc.inventory.filter(i => i !== item);
                }
                console.log(`${npc.name} ate ${targetId}.`);
            }
            world.resetAction(npc);
        }
        else if (actionType === 'craft') {
             // Crafting logic
             // targetId is recipe name? e.g. 'craft:axe' -> targetId = 'axe'
             // Need recipes. Assuming simple logic for now or moving recipes to WorldManager.
             
             if (targetId === 'axe') {
                 // Check wood and stone
                 const wood = npc.inventory.find(i => i.type === 'wood');
                 const stone = npc.inventory.find(i => i.type === 'stone');
                 
                 if (wood && wood.quantity >= 1 && stone && stone.quantity >= 1) {
                     wood.quantity -= 1;
                     stone.quantity -= 1;
                     if (wood.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== wood);
                     if (stone.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== stone);
                     
                     npc.inventory.push({ id: `axe_${Date.now()}`, type: 'axe', quantity: 1 });
                     console.log(`${npc.name} crafted an axe.`);
                     npc.skills.crafting = Math.min(100, npc.skills.crafting + 5);
                 } else {
                     console.log(`${npc.name} failed to craft axe (missing mats).`);
                 }
             } else if (targetId === 'plank') {
                 // Check wood
                 const woodItems = ['tree', 'tree_oak', 'tree_pine', 'fallen_log', 'wood'];
                 const wood = npc.inventory.find(i => woodItems.includes(i.type));
                 
                 if (wood && wood.quantity >= 1) {
                     wood.quantity -= 1;
                     if (wood.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== wood);
                     
                     npc.inventory.push({ id: `plank_${Date.now()}`, type: 'plank', quantity: 2 });
                     console.log(`${npc.name} crafted planks.`);
                     npc.skills.crafting = Math.min(100, npc.skills.crafting + 2);
                 } else {
                     console.log(`${npc.name} failed to craft plank (missing wood).`);
                 }
             } else if (targetId === 'chest') {
                 // Chest requires wood (planks) and stone
                 const wood = npc.inventory.find(i => ['plank', 'wood'].includes(i.type));
                 const stone = npc.inventory.find(i => i.type === 'stone');
                 
                 if (wood && wood.quantity >= 4 && stone && stone.quantity >= 2) {
                     wood.quantity -= 4;
                     stone.quantity -= 2;
                     if (wood.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== wood);
                     if (stone.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== stone);
                     
                     npc.inventory.push({ id: `chest_${Date.now()}`, type: 'chest', quantity: 1, category: 'bulky' });
                     console.log(`${npc.name} crafted a chest.`);
                     npc.skills.crafting = Math.min(100, npc.skills.crafting + 8);
                 } else {
                     console.log(`${npc.name} failed to craft chest (needs 4 wood, 2 stone).`);
                 }
             } else if (targetId === 'sack') {
                 // Sack requires plant fiber
                 const fiber = npc.inventory.find(i => i.type === 'plant_fiber');
                 
                 if (fiber && fiber.quantity >= 3) {
                     fiber.quantity -= 3;
                     if (fiber.quantity <= 0) npc.inventory = npc.inventory.filter(i => i !== fiber);
                     
                     npc.inventory.push({ id: `sack_${Date.now()}`, type: 'sack', quantity: 1, category: 'small' });
                     console.log(`${npc.name} crafted a sack.`);
                     npc.skills.crafting = Math.min(100, npc.skills.crafting + 5);
                 } else {
                     console.log(`${npc.name} failed to craft sack (needs 3 plant_fiber).`);
                 }
             }
             world.resetAction(npc);
        }
    }
}
