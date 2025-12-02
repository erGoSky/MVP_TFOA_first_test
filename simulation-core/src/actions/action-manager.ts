import { NPC, WorldState } from "../types";
import { WorldManager } from "../world";

export interface ActionHandler {
  execute(npc: NPC, actionType: string, params: any, world: WorldManager): void;
}

export class ActionManager {
  private handlers: Map<string, ActionHandler> = new Map();

  registerHandler(actionType: string, handler: ActionHandler) {
    this.handlers.set(actionType, handler);
  }

  executeAction(npc: NPC, actionString: string, world: WorldManager) {
    const [actionType, targetId] = actionString.split(":");

    // Default params (can be expanded if we parse more complex strings or pass params separately)
    // Currently world.ts passes params via deciding logic, but executeAction signature in world.ts
    // mainly uses the string.
    // Actually, world.ts executeAction logic often re-derives context from targetId.

    const handler = this.handlers.get(actionType);
    if (handler) {
      handler.execute(npc, actionType, targetId, world);
    } else {
      console.warn(`No handler for action type: ${actionType}`);
      world.resetAction(npc);
    }
  }
}
