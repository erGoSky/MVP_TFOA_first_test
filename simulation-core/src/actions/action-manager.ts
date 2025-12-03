import { NPC, WorldState } from "../types";
import { WorldManager } from "../world";

/**
 * Interface for action handlers that execute specific NPC actions.
 */
export interface ActionHandler {
  /**
   * Executes the action for an NPC.
   *
   * @param npc - The NPC performing the action
   * @param actionType - Type of action being performed
   * @param params - Action parameters (often a target ID)
   * @param world - World manager instance for world modifications
   */
  execute(npc: NPC, actionType: string, params: any, world: WorldManager): void;
}

/**
 * Manages registration and execution of NPC actions.
 *
 * The ActionManager maintains a registry of action handlers and routes
 * action execution to the appropriate handler based on action type.
 *
 * @example
 * ```typescript
 * const actionManager = new ActionManager();
 * actionManager.registerHandler('gather', new GatherHandler());
 * actionManager.executeAction(npc, 'gather:resource_1', world);
 * ```
 */
export class ActionManager {
  private handlers: Map<string, ActionHandler> = new Map();

  /**
   * Registers an action handler for a specific action type.
   *
   * @param actionType - Type of action (e.g., 'gather', 'move', 'craft')
   * @param handler - Handler instance that implements ActionHandler interface
   */
  registerHandler(actionType: string, handler: ActionHandler) {
    this.handlers.set(actionType, handler);
  }

  /**
   * Executes an action for an NPC.
   *
   * Parses the action string to extract type and target, then delegates
   * to the appropriate registered handler.
   *
   * @param npc - NPC performing the action
   * @param actionString - Action string in format "actionType:targetId"
   * @param world - World manager instance
   *
   * @example
   * ```typescript
   * actionManager.executeAction(npc, 'gather:resource_5', world);
   * ```
   */
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
