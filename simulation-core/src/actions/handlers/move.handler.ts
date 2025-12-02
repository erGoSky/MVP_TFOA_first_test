import { ActionHandler } from "../action-manager";
import { NPC, WorldState } from "../../types";
import { WorldManager } from "../../world";

export class MoveHandler implements ActionHandler {
  execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
    const state = world.getState();
    let targetPos = { x: npc.position.x, y: npc.position.y };

    if (targetId === "tavern") {
      const tavern = Object.values(state.buildings).find((b) => b.buildingType === "tavern");
      if (tavern) targetPos = tavern.position;
    } else if (state.resources[targetId]) {
      targetPos = state.resources[targetId].position;
    } else if (state.buildings[targetId]) {
      targetPos = state.buildings[targetId].position;
    } else if (npc.memory && npc.memory.locations.has(targetId)) {
      // Check memory
      const mem = npc.memory.locations.get(targetId);
      if (mem) targetPos = mem.position;
    }

    const dx = targetPos.x - npc.position.x;
    const dy = targetPos.y - npc.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = npc.stats.speed * 0.5; // Base speed

    if (dist <= speed) {
      npc.position = targetPos;
      console.log(`${npc.name} arrived at ${targetId}.`);
      world.resetAction(npc);
    } else {
      const ratio = speed / dist;
      npc.position.x += dx * ratio;
      npc.position.y += dy * ratio;
      // Continue moving next tick
    }
  }
}
