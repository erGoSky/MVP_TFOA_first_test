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

const debugMode = process.env.DEBUG_SINGLE_NPC === "true";

export class WorldManager {
  // Public for system access
  public timeManager: TimeManager;
  public entityManager: EntityManager;
  public actionManager: ActionManager;

  private aiSystem: AISystem;

  // Store tiles to persist biome data
  private tiles: any[][] = [];
  private tilesInitialized: boolean = false;

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

    // Initialize tiles
    this.initializeTiles();
  }

  private initializeTiles() {
    for (let y = 0; y < 100; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < 100; x++) {
        this.tiles[y][x] = { biome: "grass", resource: null };
      }
    }
    this.tilesInitialized = true;
  }

  // Allow world generator to set tiles
  public setTiles(tiles: any[][]) {
    this.tiles = tiles;
    this.tilesInitialized = true;
  }

  // Allow world generator to set individual tile
  public setTile(x: number, y: number, tile: any) {
    if (y >= 0 && y < this.tiles.length && x >= 0 && x < this.tiles[y].length) {
      this.tiles[y][x] = tile;
    }
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
    this.initializeTiles();
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
      tiles: this.tiles, // Return stored tiles
      ...entityState,
      contracts: {}, // Contracts not yet managed
    };
  }

  // Main Loop
  public async onTick(tick: number) {
    const npcs = this.entityManager.getNPCs();

    if (debugMode) {
      // Debug Mode: Process only the first NPC and wait for it
      const npc = npcs[0];
      if (npc) {
        // console.log(`[DEBUG] Processing single NPC: ${npc.name}`);
        await this.aiSystem.update(npc, this, tick);
      }
    } else {
      // Normal Mode: Update all NPCs concurrently (fire and forget)
      npcs.forEach((npc) => {
        this.aiSystem.update(npc, this, tick);
      });
    }
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
        npc.inventory = npc.inventory.filter((i) => i !== item);
      }
    }
  }

  // Save/Load (should move to FileManager)
  public saveState(filename: string) {
    const state = this.getState();
    const fs = require("fs");
    fs.writeFileSync(filename, JSON.stringify(state, null, 2));
    console.log(`World saved to ${filename}`);
  }

  public loadState(filename: string) {
    const fs = require("fs");
    const data = fs.readFileSync(filename, "utf-8");
    const state = JSON.parse(data);

    // Restore time
    this.timeManager.setTick(state.tick);

    // Restore entities
    this.entityManager.reset();
    Object.values(state.npcs).forEach((npc: any) => {
      const restored = this.entityManager.createNPC(
        npc.id,
        npc.name,
        npc.position,
        npc.skills,
        npc.personality.archetype
      );
      Object.assign(restored, npc);
    });

    Object.values(state.resources).forEach((res: any) => {
      const restored = this.entityManager.createResource(
        res.id,
        res.resourceType,
        res.position,
        res.amount,
        res.properties
      );
      Object.assign(restored, res);
    });

    Object.values(state.buildings).forEach((bld: any) => {
      const restored = this.entityManager.createBuilding(bld.id, bld.buildingType, bld.position);
      Object.assign(restored, bld);
    });

    // Restore tiles
    if (state.tiles) {
      this.tiles = state.tiles;
      this.tilesInitialized = true;
    }

    console.log(`World loaded from ${filename}`);
  }

  public async getSavesList(): Promise<string[]> {
    const fs = require("fs");
    const path = require("path");
    const savesDir = "./saves";

    if (!fs.existsSync(savesDir)) {
      return [];
    }

    return fs.readdirSync(savesDir).filter((file: string) => file.endsWith(".json"));
  }

  public async deleteSave(filename: string): Promise<void> {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join("./saves", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted save file: ${filename}`);
    } else {
      throw new Error(`Save file not found: ${filename}`);
    }
  }

  // Helper for distance calculation (used by handlers)
  public getDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
