import { ActionHandler } from '../action-manager';
import { NPC, WorldState } from '../../types';
import { WorldManager } from '../../world';

export class TradingHandler implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        const state = world.getState();
        const tavern = Object.values(state.buildings).find(b => b.buildingType === 'tavern');

        if (!tavern) {
            console.log(`${npc.name} cannot trade (no tavern found).`);
            world.resetAction(npc);
            return;
        }

        if (world.getDistance(npc.position, tavern.position) > 1.5) {
            console.log(`${npc.name} cannot trade (too far from tavern).`);
            world.resetAction(npc);
            return;
        }

        if (actionType === 'sell') {
            // targetId is the item type to sell
            const item = npc.inventory.find(i => i.type === targetId);
            
            if (item && item.quantity > 0) {
                // Calculate price based on item properties or use base value
                const basePrice = 2; // Default price per item
                const sellPrice = basePrice;
                
                // Remove item from NPC
                world.removeFromInventory(npc, targetId, 1);
                
                // Add gold to NPC
                npc.stats.money += sellPrice;
                
                // Add item to tavern (optional - for realism)
                world.addToInventory(tavern as any, targetId, 1);
                
                console.log(`${npc.name} sold ${targetId} for ${sellPrice} gold.`);
            } else {
                console.log(`${npc.name} has no ${targetId} to sell.`);
            }
            world.resetAction(npc);
        }
        else if (actionType === 'buy') {
            // targetId is the item type to buy
            const basePrice = 5; // Default buy price
            const buyPrice = basePrice;
            
            if (npc.stats.money >= buyPrice) {
                // Check if tavern has the item (optional)
                const tavernItem = tavern.inventory.find(i => i.type === targetId);
                
                // If tavern doesn't have it, create it (infinite stock for now)
                if (!tavernItem || tavernItem.quantity < 1) {
                    // Tavern can "generate" basic items
                    world.addToInventory(tavern as any, targetId, 10); // Stock up
                }
                
                // Transfer money
                npc.stats.money -= buyPrice;
                tavern.gold += buyPrice;
                
                // Transfer item
                world.removeFromInventory(tavern as any, targetId, 1);
                world.addToInventory(npc, targetId, 1);
                
                console.log(`${npc.name} bought ${targetId} for ${buyPrice} gold.`);
            } else {
                console.log(`${npc.name} cannot afford ${targetId} (needs ${buyPrice} gold).`);
            }
            world.resetAction(npc);
        }
    }
}
