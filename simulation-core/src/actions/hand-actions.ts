import { ActionHandler } from './action-manager';
import { NPC, WorldState } from '../types';
import { WorldManager } from '../world';

export class HandActions implements ActionHandler {
    execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
        if (actionType === 'place') {
            if (npc.hands) {
                // Place item from hands into world
                const item = npc.hands;
                const pos = { x: npc.position.x, y: npc.position.y }; // Place at current feet? Or target?
                // For now, place at current location + offset? Or just current.
                
                // Create building or resource?
                // Chest/Barrel -> Building (with inventory)
                // Log -> Resource
                
                if (['chest', 'barrel'].includes(item.type)) {
                    const buildingId = `build_${Date.now()}`;
                    world.createBuilding(buildingId, item.type, pos);
                    const building = world.getState().buildings[buildingId];
                    if (building) {
                        building.ownerId = npc.id; // Placed by NPC
                        // Transfer contents if any
                        if (item.contents) {
                            building.inventory = [...item.contents];
                        }
                    }
                    console.log(`${npc.name} placed ${item.type}.`);
                    npc.hands = null;
                    world.resetAction(npc);
                } else {
                    console.log(`${npc.name} cannot place ${item.type} (not a building).`);
                    world.resetAction(npc);
                }
            } else {
                console.log(`${npc.name} has nothing to place.`);
                world.resetAction(npc);
            }
        }
    }
}
