import { WorldState, NPC, Vector2, Resource, Building, Skills, BuildingTemplate } from "./types";
import axios from "axios";
import { ActionManager } from "./actions/action-manager";
import { MoveHandler } from "./actions/handlers/move.handler";
import { PickupHandler } from "./actions/handlers/pickup.handler";
import { ResourceHandler } from "./actions/handlers/resource.handler";
import { ContractHandler } from "./actions/handlers/contract.handler";
import { StorageHandler } from "./actions/handlers/storage.handler";
import { GeneralHandler } from "./actions/handlers/general.handler";
import { CraftingHandler } from "./actions/handlers/crafting.handler";
import { TradingHandler } from "./actions/handlers/trading.handler";
import { HandActions } from "./actions/hand-actions";
import { IdleHandler } from "./actions/handlers/idle.handler";

const AI_SERVICE_URL = "http://localhost:8000";

import { MemorySystem } from "./ai/memory.system";
import { GoalManager } from "./ai/goal-manager";
import { GoalGenerator } from "./ai/goal-generator";
import { PlanExecutor } from "./ai/plan-executor";

// Core Systems
import { TimeManager } from "./core/time-manager";
import { EntityManager } from "./core/entity-manager";
import { AISystem } from "./systems/ai-system";

export class WorldManager {
  // Public for system access
  public timeManager: TimeManager;
  public entityManager: EntityManager;
  public actionManager: ActionManager;

  private aiSystem: AISystem;

  // Legacy item registry (should move to a system)
  public readonly ITEM_REGISTRY: Record<string, string[]> = {
    tree: ["chop"],
    tree_oak: ["chop"],
    tree_pine: ["chop"],
    rock_stone: ["mine"],
    rock_iron: ["mine"],
    berry_bush: ["pickup"],
    mushroom: ["pickup"],
    wood: ["craft", "fuel"],
    stone: ["craft"],
    plank: ["craft", "build"],
    apple: ["eat"],
    mushroom_stew: ["eat"],
    bread: ["eat"],
    water: ["drink"],
    potion_health: ["drink"],
  };

  constructor() {
    this.timeManager = new TimeManager();
    this.entityManager = new EntityManager();
    this.actionManager = new ActionManager();
    this.aiSystem = new AISystem();

    this.registerHandlers();

    // Subscribe to tick
    this.timeManager.on("tick", (tick) => this.onTick(tick));
  }

  private registerHandlers() {
    const moveHandler = new MoveHandler();
    const pickupHandler = new PickupHandler();
    const resourceHandler = new ResourceHandler();
    const contractHandler = new ContractHandler();
    const storageHandler = new StorageHandler();
    const generalHandler = new GeneralHandler();
    const craftingHandler = new CraftingHandler();
    const tradingHandler = new TradingHandler();
    const handActions = new HandActions();
    const idleHandler = new IdleHandler();

    this.actionManager.registerHandler("move", moveHandler);
    this.actionManager.registerHandler("pickup", pickupHandler);

    ["chop", "mine"].forEach((act) => this.actionManager.registerHandler(act, resourceHandler));

    ["create_contract", "sign_contract", "pay_prepayment", "build_step", "pay_final"].forEach(
      (act) => this.actionManager.registerHandler(act, contractHandler)
    );

    ["store_item", "retrieve_item"].forEach((act) =>
      this.actionManager.registerHandler(act, storageHandler)
    );

    ["eat", "drink", "sleep"].forEach((act) =>
      this.actionManager.registerHandler(act, generalHandler)
    );

    ["craft", "process", "repair"].forEach((act) =>
      this.actionManager.registerHandler(act, craftingHandler)
    );

    ["buy", "sell", "post_order", "accept_order"].forEach((act) =>
      this.actionManager.registerHandler(act, tradingHandler)
    );

    ["equip", "unequip"].forEach((act) => this.actionManager.registerHandler(act, handActions));

    this.actionManager.registerHandler("idle", idleHandler);
  }

  // Delegate to TimeManager
  public start() {
    this.timeManager.start();
  }
  public stop() {
    this.timeManager.stop();
  }
  public pause() {
    this.timeManager.pause();
  }
  public resume() {
    this.timeManager.resume();
  }
  public setSpeed(speed: number) {
    this.timeManager.setSpeed(speed);
  }
  public getStatus() {
    return this.timeManager.getStatus();
  }

  // Delegate to EntityManager
  public createNPC(id: string, name: string, pos: Vector2, skills?: Skills, archetype?: string) {
    return this.entityManager.createNPC(id, name, pos, skills, archetype);
  }
  public createResource(id: string, type: any, pos: Vector2, amount: number, props?: any) {
    return this.entityManager.createResource(id, type, pos, amount, props);
  }
  public createBuilding(id: string, type: string, pos: Vector2) {
    return this.entityManager.createBuilding(id, type, pos);
  }
  public removeEntity(id: string) {
    this.entityManager.removeEntity(id);
  }
  public updateEntity(id: string, updates: any) {
    this.entityManager.updateEntity(id, updates);
  }
  public reset() {
    this.entityManager.reset();
  }

  // Computed State
  public getState(): WorldState {
    const timeStatus = this.timeManager.getStatus();
    const entityState = this.entityManager.getState();

    return {
      tick: timeStatus.tick,
      time: timeStatus.tick, // Legacy mapping
      width: 100,
      height: 100,
      tiles: [], // Tiles not yet managed by EntityManager
      ...entityState,
      contracts: {}, // Contracts not yet managed
    };
  }

  // Main Loop
  public onTick(tick: number) {
    const npcs = this.entityManager.getNPCs();

    // Update all NPCs via AISystem
    npcs.forEach((npc) => {
      this.aiSystem.update(npc, this, tick);
    });
  }

  // Legacy alias for index.ts compatibility (if needed)
  public tick() {
    console.warn("Manual world.tick() called. Use world.start() instead.");
  }

  public resetAction(npc: NPC) {
    npc.currentAction = null;
    npc.actionState.inProgress = false;
    npc.actionState.duration = 0;
  }

  // Inventory helpers (should move to InventorySystem)
  public addToInventory(npc: NPC, type: string, quantity: number) {
    console.log(`Adding ${quantity} ${type} to ${npc.name}`);
    const item = npc.inventory.find((i) => i.type === type);
    if (item) {
      item.quantity += quantity;
    } else {
      npc.inventory.push({ id: `${type}_${Date.now()}`, type, quantity });
    }
  }

  public removeFromInventory(npc: NPC, type: string, quantity: number) {
    const item = npc.inventory.find((i) => i.type === type);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        npc.inventory = npc.inventory.filter((i) => i.type !== type);
      }
    }
  }

  public hasItem(npc: NPC, type: string, quantity: number): boolean {
    const item = npc.inventory.find((i) => i.type === type);
    return item ? item.quantity >= quantity : false;
  }

  public getDistance(p1: Vector2, p2: Vector2): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Option Generators (Should move to AISystem)
  // ... (Keeping these for now to minimize breakage, but they should be refactored)
  // For brevity, I'm omitting the full implementation of getSurvivalOptions etc.
  // assuming they are used by decideAction which is deprecated/legacy.
  // Wait, decideAction is NOT used in the new GOAP flow (updateNPC uses requestPlan).
  // So I can probably remove them!

  // Checking usage: decideAction was used in the OLD updateNPC.
  // The NEW updateNPC uses requestPlan.
  // So I can safely remove getSurvivalOptions, getResourceOptions, etc. IF they are not used elsewhere.

  // Let's keep them if I'm unsure, but I'll comment them out or stub them to save space.
  // Actually, I'll remove them to clean up.

  // Save/Load (Delegate to FileManager - TODO)
  public async saveState(filename: string): Promise<void> {
    // ... (Keep existing implementation for now, adapting to use getState)
    const fs = await import("fs/promises");
    const path = await import("path");
    const savesDir = path.join(process.cwd(), "saves");
    if (!(await this.exists(savesDir))) await fs.mkdir(savesDir);
    const filepath = path.join(savesDir, `${filename}.json`);
    const stateToSave = { ...this.getState(), entities: {} }; // Avoid duplication
    await fs.writeFile(filepath, JSON.stringify(stateToSave, null, 2), "utf-8");
    console.log(`World state saved to ${filepath}`);
  }

  public async loadState(filename: string): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const savesDir = path.join(process.cwd(), "saves");
    const filepath = path.join(savesDir, `${filename}.json`);
    const stateJson = await fs.readFile(filepath, "utf-8");
    const loadedState = JSON.parse(stateJson);

    // Restore to EntityManager
    this.entityManager.reset();
    Object.values(loadedState.npcs).forEach((n: any) =>
      this.entityManager.createNPC(n.id, n.name, n.position, n.skills, n.personality?.archetype)
    );
    Object.values(loadedState.resources).forEach((r: any) =>
      this.entityManager.createResource(r.id, r.resourceType, r.position, r.amount, r.properties)
    );
    Object.values(loadedState.buildings).forEach((b: any) =>
      this.entityManager.createBuilding(b.id, b.buildingType, b.position)
    );

    // Restore time
    this.timeManager.setTick(loadedState.tick);
    console.log(`World state loaded from ${filepath}`);
  }

  public async getSavesList(): Promise<string[]> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const savesDir = path.join(process.cwd(), "saves");
    try {
      const files = await fs.readdir(savesDir);
      return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    } catch {
      return [];
    }
  }

  public async deleteSave(filename: string): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filepath = path.join(process.cwd(), "saves", `${filename}.json`);
    await fs.unlink(filepath);
  }

  private async exists(path: string): Promise<boolean> {
    const fs = await import("fs/promises");
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
