import { WorldState, NPC, Vector2, Resource, Building, Skills, BuildingTemplate } from "./types";
import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
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
import { DeltaManager } from "./core/delta-manager";

const debugMode = process.env.DEBUG_SINGLE_NPC === "true";

/**
 * Main world manager that coordinates all simulation systems.
 *
 * The WorldManager is the central controller for the simulation, managing:
 * - Time progression and tick updates
 * - Entity lifecycle (NPCs, resources, buildings)
 * - Action execution and routing
 * - AI system updates
 * - State delta tracking
 * - Terrain and tile management
 *
 * It delegates to specialized managers (TimeManager, EntityManager, ActionManager, etc.)
 * and coordinates their interactions.
 *
 * @example
 * ```typescript
 * const world = new WorldManager();
 * world.start(); // Begin simulation
 *
 * // Create entities
 * world.createNPC('npc_1', 'Alice', { x: 50, y: 50 });
 * world.createResource('res_1', 'tree_oak', { x: 10, y: 10 }, 100);
 *
 * // Control simulation
 * world.pause();
 * world.setSpeed(2); // 2x speed
 * world.resume();
 *
 * // Get state
 * const state = world.getState();
 * const delta = world.getState(lastTick);
 * ```
 */
export class WorldManager {
  // Public for system access
  public timeManager: TimeManager;
  public entityManager: EntityManager;
  public actionManager: ActionManager;
  public deltaManager: DeltaManager;

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

  /**
   * Creates a new WorldManager instance.
   *
   * Initializes all core systems:
   * - TimeManager for tick progression
   * - EntityManager for entity lifecycle
   * - ActionManager for action routing
   * - DeltaManager for state change tracking
   * - AISystem for NPC decision-making
   *
   * Registers all action handlers and subscribes to events.
   */
  constructor() {
    this.timeManager = new TimeManager();
    this.entityManager = new EntityManager();
    this.actionManager = new ActionManager();
    this.deltaManager = new DeltaManager();
    this.aiSystem = new AISystem();

    // Subscribe DeltaManager to EntityManager events
    this.entityManager.on("created", (entity) =>
      this.deltaManager.addChange(entity.id, "created", entity)
    );
    this.entityManager.on("updated", (entity) =>
      this.deltaManager.addChange(entity.id, "updated", entity)
    );
    this.entityManager.on("removed", (id) => this.deltaManager.addChange(id, "removed"));

    this.registerHandlers();

    // Subscribe to tick
    this.timeManager.on("tick", (tick) => this.onTick(tick));

    // Initialize tiles
    this.initializeTiles();
  }

  /**
   * Initializes the tile grid with default grass biome.
   * @private
   */
  private initializeTiles() {
    for (let y = 0; y < 100; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < 100; x++) {
        this.tiles[y][x] = { biome: "grass", resource: null };
      }
    }
    this.tilesInitialized = true;
  }

  /**
   * Sets the entire tile grid (used by WorldGenerator).
   *
   * @param tiles - 2D array of tile data
   */
  public setTiles(tiles: any[][]) {
    this.tiles = tiles;
    this.tilesInitialized = true;
  }

  /**
   * Sets a single tile (used by WorldGenerator).
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param tile - Tile data
   */
  public setTile(x: number, y: number, tile: any) {
    if (y >= 0 && y < this.tiles.length && x >= 0 && x < this.tiles[y].length) {
      this.tiles[y][x] = tile;
    }
  }

  /**
   * Registers all action handlers with the ActionManager.
   * @private
   */
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

    ["chop", "mine", "gather", "hunt", "farm"].forEach((act) =>
      this.actionManager.registerHandler(act, resourceHandler)
    );

    this.actionManager.registerHandler("contract", contractHandler);

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

  // ========== Time Control Methods ==========

  /** Starts the simulation time loop */
  public start() {
    this.timeManager.start();
  }

  /** Stops the simulation time loop */
  public stop() {
    this.timeManager.stop();
  }

  /** Pauses the simulation (tick loop continues but NPCs don't update) */
  public pause() {
    this.timeManager.pause();
  }

  /** Resumes the simulation from paused state */
  public resume() {
    this.timeManager.resume();
  }

  /**
   * Sets the simulation speed multiplier.
   *
   * @param speed - Speed multiplier (1, 2, 4, 8, or 16)
   */
  public setSpeed(speed: number) {
    this.timeManager.setSpeed(speed);
  }

  /**
   * Gets the current simulation status.
   *
   * @returns Object with paused state, speed, and current tick
   */
  public getStatus() {
    return this.timeManager.getStatus();
  }

  // ========== Entity Management Methods ==========

  /**
   * Creates a new NPC entity.
   * Delegates to EntityManager.
   */
  public createNPC(id: string, name: string, pos: Vector2, skills?: Skills, archetype?: string) {
    return this.entityManager.createNPC(id, name, pos, skills, archetype);
  }

  /**
   * Creates a new resource entity.
   * Delegates to EntityManager.
   */
  public createResource(id: string, type: any, pos: Vector2, amount: number, props?: any) {
    return this.entityManager.createResource(id, type, pos, amount, props);
  }

  /**
   * Creates a new building entity.
   * Delegates to EntityManager.
   */
  public createBuilding(id: string, type: string, pos: Vector2) {
    return this.entityManager.createBuilding(id, type, pos);
  }

  /**
   * Removes an entity from the world.
   * Delegates to EntityManager.
   */
  public removeEntity(id: string) {
    this.entityManager.removeEntity(id);
  }

  /**
   * Updates an entity with partial data.
   * Delegates to EntityManager.
   */
  public updateEntity(id: string, updates: any) {
    this.entityManager.updateEntity(id, updates);
  }

  /**
   * Resets the entire world state.
   *
   * Clears all entities, deltas, and reinitializes tiles.
   */
  public reset() {
    this.entityManager.reset();
    this.deltaManager.reset();
    this.initializeTiles();
  }

  // ========== State Access Methods ==========

  /**
   * Gets the complete world state or delta updates.
   *
   * Overloaded method:
   * - No args: Returns full WorldState
   * - With lastTick: Returns delta changes since that tick
   *
   * @param lastTick - Optional last tick for delta updates
   * @returns Full state or delta object
   *
   * @example
   * ```typescript
   * // Get full state
   * const fullState = world.getState();
   *
   * // Get delta since tick 100
   * const delta = world.getState(100);
   * ```
   */
  public getState(): WorldState;
  public getState(lastTick: number): { tick: number; delta: any[] };
  public getState(lastTick?: number): WorldState | { tick: number; delta: any[] } {
    const timeStatus = this.timeManager.getStatus();

    if (lastTick !== undefined && lastTick >= 0) {
      // Return delta
      return {
        tick: timeStatus.tick,
        delta: this.deltaManager.getDeltaSince(lastTick),
      };
    }

    // Return full state
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

  // ========== Simulation Loop ==========

  /**
   * Main simulation tick handler.
   *
   * Called by TimeManager on each tick. Updates all NPCs via AISystem
   * and commits deltas for this tick.
   *
   * In debug mode (DEBUG_SINGLE_NPC=true), processes only the first NPC synchronously.
   * In normal mode, updates all NPCs concurrently.
   *
   * @param tick - Current simulation tick number
   * @private
   */
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

    // Commit delta for this tick
    this.deltaManager.commitTick(tick);
  }

  /**
   * Legacy manual tick method.
   * @deprecated Use start() instead
   */
  public tick() {
    console.warn("Manual world.tick() called. Use world.start() instead.");
  }

  /**
   * Saves the current world state to a file.
   *
   * @param filename - Name of the file to save to (relative to saves/ directory)
   */
  public async saveState(filename: string): Promise<void> {
    const state = this.getState();
    const saveDir = path.join(process.cwd(), "saves");

    try {
      await fs.mkdir(saveDir, { recursive: true });
      await fs.writeFile(path.join(saveDir, filename), JSON.stringify(state, null, 2));
      console.log(`World saved to ${filename}`);
    } catch (error) {
      console.error(`Failed to save world: ${error}`);
      throw error;
    }
  }

  /**
   * Loads world state from a file.
   *
   * @param filename - Name of the file to load from (relative to saves/ directory)
   */
  public async loadState(filename: string): Promise<void> {
    const saveDir = path.join(process.cwd(), "saves");

    try {
      const data = await fs.readFile(path.join(saveDir, filename), "utf-8");
      const state = JSON.parse(data) as WorldState;

      // Restore state
      this.reset();

      // Restore time
      if (state.tick) {
        // We need to access private tick property or use a method if available
        // For now, we'll just reset time manager and let it start from 0 or
        // we should add a setTick method to TimeManager.
        // Assuming TimeManager starts at 0.
      }

      // Restore tiles
      if (state.tiles) {
        this.setTiles(state.tiles);
      }

      // Restore entities
      if (state.npcs) {
        Object.values(state.npcs).forEach((npc) => {
          this.entityManager.createNPC(
            npc.id,
            npc.name,
            npc.position,
            npc.skills,
            npc.personality?.archetype
          );
          // Restore other properties... this is a simplified restore
          const restored = this.entityManager.getEntity(npc.id) as NPC;
          if (restored) {
            Object.assign(restored, npc);
          }
        });
      }

      if (state.resources) {
        Object.values(state.resources).forEach((res) => {
          this.entityManager.createResource(
            res.id,
            res.resourceType,
            res.position,
            res.amount,
            res.properties
          );
        });
      }

      if (state.buildings) {
        Object.values(state.buildings).forEach((bld) => {
          this.entityManager.createBuilding(bld.id, bld.buildingType, bld.position);
          // Restore inventory etc
          const restored = this.entityManager.getEntity(bld.id) as Building;
          if (restored) {
            Object.assign(restored, bld);
          }
        });
      }

      console.log(`World loaded from ${filename}`);
    } catch (error) {
      console.error(`Failed to load world: ${error}`);
      throw error;
    }
  }

  /**
   * Gets a list of available save files.
   *
   * @returns Array of save filenames
   */
  public async getSavesList(): Promise<string[]> {
    const saveDir = path.join(process.cwd(), "saves");
    try {
      await fs.mkdir(saveDir, { recursive: true });
      const files = await fs.readdir(saveDir);
      return files.filter((f) => f.endsWith(".json"));
    } catch (error) {
      console.error(`Failed to list saves: ${error}`);
      return [];
    }
  }

  /**
   * Calculates the distance between two positions.
   *
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns Distance in world units
   */
  public getDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Adds an item to an entity's inventory.
   *
   * @param entity - Entity (NPC or Building) to add item to
   * @param type - Item type
   * @param quantity - Amount to add
   */
  public addToInventory(entity: NPC | Building, type: string, quantity: number) {
    const existingItem = entity.inventory.find((i) => i.type === type);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      entity.inventory.push({
        id: `item_${Date.now()}_${Math.random()}`,
        type,
        quantity,
      });
    }
  }

  /**
   * Removes an item from an entity's inventory.
   *
   * @param entity - Entity (NPC or Building) to remove item from
   * @param type - Item type
   * @param quantity - Amount to remove
   * @returns True if successful, false if insufficient quantity
   */
  public removeFromInventory(entity: NPC | Building, type: string, quantity: number): boolean {
    const item = entity.inventory.find((i) => i.type === type);
    if (!item || item.quantity < quantity) return false;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      entity.inventory = entity.inventory.filter((i) => i !== item);
    }
    return true;
  }

  /**
   * Deletes a save file.
   *
   * @param filename - Name of the file to delete
   */
  public async deleteSave(filename: string): Promise<void> {
    const saveDir = path.join(process.cwd(), "saves");
    try {
      await fs.unlink(path.join(saveDir, filename));
      console.log(`Deleted save: ${filename}`);
    } catch (error) {
      console.error(`Failed to delete save ${filename}: ${error}`);
      throw error;
    }
  }

  /**
   * Resets an NPC's current action.
   *
   * @param npc - NPC to reset
   */
  public resetAction(npc: NPC) {
    npc.currentAction = null;
    npc.actionState = {
      inProgress: false,
      startTime: 0,
      duration: 0,
    };
  }
}
