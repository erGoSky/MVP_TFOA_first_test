import { ActionHandler } from "../action-manager";
import { NPC, WorldState } from "../../types";
import { WorldManager } from "../../world";

export class GeneralHandler implements ActionHandler {
  execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
    const state = world.getState();

    if (actionType === "sleep") {
      let recoveryRate = 0.2; // Default outside sleeping
      if (npc.ownedBuildingIds.length > 0) {
        const homeId = npc.ownedBuildingIds[0];
        const home = state.buildings[homeId];
        if (home && world.getDistance(npc.position, home.position) <= 2.0) {
          recoveryRate = 0.8; // Sleeping in own bed
        }
      }
      npc.needs.energy = Math.min(1, npc.needs.energy + recoveryRate);
      console.log(`${npc.name} finished sleeping (Rate: ${recoveryRate}).`);
      world.resetAction(npc);
    } else if (actionType === "work") {
      const profit = 10; // Default profit
      npc.stats.money += profit;
      console.log(`${npc.name} worked and earned ${profit} gold.`);
      world.resetAction(npc);
    }
  }
}
