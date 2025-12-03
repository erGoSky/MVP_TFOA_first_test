import { NPC, Resource, Building, Entity, Vector2, Skills, BuildingTemplate } from "../types";
import { PersonalityGenerator } from "../personality/generator";
import { SpatialGrid } from "./spatial-grid";

/**
 * Manages all entities in the simulation world.
 *
 * The EntityManager is responsible for creating, updating, and removing entities
 * (NPCs, resources, buildings). It maintains a spatial grid for efficient proximity
 * queries and emits events when entities change.
 *
 * @fires created - When an entity is created
 * @fires updated - When an entity is updated
 * @fires removed - When an entity is removed
 *
 * @example
 * ```typescript
 * const entityManager = new EntityManager();
 *
 * // Listen for entity changes
 * entityManager.on('created', (entity) => {
 *   console.log(`Created: ${entity.id}`);
 * });
 *
 * // Create an NPC
 * const npc = entityManager.createNPC('npc_1', 'Alice', { x: 10, y: 10 });
 * ```
 */
export class EntityManager {
  private entities: Record<string, Entity> = {};
  private npcs: Record<string, NPC> = {};
  private resources: Record<string, Resource> = {};
  private buildings: Record<string, Building> = {};
  private spatialGrid: SpatialGrid;

  // Event Listeners
  private listeners: {
    created: ((entity: Entity) => void)[];
    updated: ((entity: Entity) => void)[];
    removed: ((id: string) => void)[];
  } = { created: [], updated: [], removed: [] };

  /**
   * Registers an event listener for entity lifecycle events.
   *
   * @param event - Event type ('created', 'updated', or 'removed')
   * @param callback - Function to call when event occurs
   */
  public on(event: "created" | "updated", callback: (entity: Entity) => void): void;
  public on(event: "removed", callback: (id: string) => void): void;
  public on(event: string, callback: any): void {
    if (event === "created") this.listeners.created.push(callback);
    else if (event === "updated") this.listeners.updated.push(callback);
    else if (event === "removed") this.listeners.removed.push(callback);
  }

  // Templates (moved from WorldManager)
  public readonly BUILDING_TEMPLATES: Record<string, BuildingTemplate> = {
    house_small: {
      id: "house_small",
      name: "Small House",
      components: [
        { type: "wall_stone", count: 4 },
        { type: "door_plank", count: 1 },
        { type: "roof_hay", count: 1 },
      ],
      laborCost: 100,
    },
    house_medium: {
      id: "house_medium",
      name: "Medium House",
      components: [
        { type: "wall_log", count: 8 },
        { type: "door_plank", count: 1 },
        { type: "window_plank", count: 2 },
        { type: "roof_leaf", count: 1 },
      ],
      laborCost: 200,
    },
  };

  /**
   * Creates a new EntityManager instance.
   *
   * Initializes the spatial grid with 20x20 tile cells for efficient proximity queries.
   */
  constructor() {
    this.spatialGrid = new SpatialGrid(20); // 20x20 tile cells
  }

  /**
   * Creates a new NPC entity.
   *
   * @param id - Unique identifier for the NPC
   * @param name - Display name for the NPC
   * @param position - Initial world position
   * @param initialSkills - Optional starting skills (defaults to basic skills)
   * @param archetype - Optional personality archetype
   * @returns The created NPC entity
   */
  public createNPC(
    id: string,
    name: string,
    position: Vector2,
    initialSkills?: Skills,
    archetype?: string
  ): NPC {
    const npc: NPC = {
      id,
      type: "npc",
      name,
      position,
      needs: { hunger: 0, energy: 1, social: 0.5 },
      stats: { health: 100, money: 0, speed: 1 },
      skills: initialSkills || { gathering: 10, crafting: 5, trading: 5 },
      personality: PersonalityGenerator.generate(archetype),
      currentAction: null,
      actionState: { inProgress: false, startTime: 0, duration: 0 },
      inventory: [],
      hands: null,
      ownedBuildingIds: [],
      memory: {
        locations: new Map(),
        lastSeen: new Map(),
      },
    };
    this.npcs[id] = npc;
    this.entities[id] = npc;
    this.spatialGrid.add(npc);
    this.listeners.created.forEach((cb) => cb(npc));

    console.log(
      `Created NPC ${name} with personality: ${PersonalityGenerator.describe(npc.personality)} (${
        npc.personality.archetype
      })`
    );
    return npc;
  }

  /**
   * Creates a new resource entity.
   *
   * @param id - Unique identifier for the resource
   * @param type - Resource type (e.g., 'wood', 'stone', 'food')
   * @param position - World position
   * @param amount - Initial resource amount
   * @param properties - Additional properties (default: { value: 1 })
   * @returns The created resource entity
   */
  public createResource(
    id: string,
    type: any,
    position: Vector2,
    amount: number,
    properties: any = { value: 1 }
  ): Resource {
    const res: Resource = {
      id,
      type: "resource",
      resourceType: type,
      position,
      amount,
      harvested: false,
      properties,
    };
    this.resources[id] = res;
    this.entities[id] = res;
    this.spatialGrid.add(res);
    this.listeners.created.forEach((cb) => cb(res));
    return res;
  }

  /**
   * Creates a new building entity.
   *
   * @param id - Unique identifier for the building
   * @param type - Building type (e.g., 'tavern', 'house_small')
   * @param position - World position
   * @returns The created building entity
   */
  public createBuilding(id: string, type: string, position: Vector2): Building {
    const building: Building = {
      id,
      type: "building",
      buildingType: type,
      position,
      inventory: [],
      gold: 0,
    };
    this.buildings[id] = building;
    this.entities[id] = building;
    this.spatialGrid.add(building);
    this.listeners.created.forEach((cb) => cb(building));
    return building;
  }

  /**
   * Removes an entity from the world.
   *
   * Removes from all registries, spatial grid, and triggers 'removed' event.
   *
   * @param id - ID of the entity to remove
   */
  public removeEntity(id: string): void {
    const entity = this.entities[id];
    if (!entity) return;

    if (entity.type === "npc") delete this.npcs[id];
    else if (entity.type === "resource") delete this.resources[id];
    else if (entity.type === "building") delete this.buildings[id];

    delete this.entities[id];
    this.spatialGrid.remove(id);
    this.listeners.removed.forEach((cb) => cb(id));
    console.log(`Entity removed: ${id}`);
  }

  /**
   * Updates an entity with partial data.
   *
   * Merges updates into entity and updates spatial grid if position changed.
   *
   * @param id - Entity ID
   * @param updates - Partial entity data to merge
   */
  public updateEntity(id: string, updates: Partial<any>): void {
    const entity = this.entities[id];
    if (!entity) return;

    Object.assign(entity, updates);

    if (entity.type === "npc") Object.assign(this.npcs[id], updates);
    else if (entity.type === "resource") Object.assign(this.resources[id], updates);
    else if (entity.type === "building") Object.assign(this.buildings[id], updates);

    // Update spatial grid if position changed
    if (updates.position) {
      this.spatialGrid.update(this.entities[id]);
    }

    this.listeners.updated.forEach((cb) => cb(this.entities[id]));

    console.log(`Entity updated: ${id}`);
  }

  /**
   * Gets an entity by ID.
   *
   * @param id - Entity ID
   * @returns The entity, or undefined if not found
   */
  public getEntity(id: string): Entity | undefined {
    return this.entities[id];
  }

  /**
   * Gets all NPCs in the world.
   *
   * @returns Array of all NPC entities
   */
  public getNPCs(): NPC[] {
    return Object.values(this.npcs);
  }

  /**
   * Gets all resources in the world.
   *
   * @returns Array of all resource entities
   */
  public getResources(): Resource[] {
    return Object.values(this.resources);
  }

  /**
   * Gets all buildings in the world.
   *
   * @returns Array of all building entities
   */
  public getBuildings(): Building[] {
    return Object.values(this.buildings);
  }

  /**
   * Gets all entities in the world.
   *
   * @returns Array of all entities (NPCs, resources, buildings)
   */
  public getAllEntities(): Entity[] {
    return Object.values(this.entities);
  }

  /**
   * Gets the complete entity state.
   *
   * @returns Object containing all entity collections
   */
  public getState() {
    return {
      entities: this.entities,
      npcs: this.npcs,
      resources: this.resources,
      buildings: this.buildings,
    };
  }

  /**
   * Resets all entities and clears the spatial grid.
   *
   * Removes all NPCs, resources, and buildings from the world.
   */
  public reset(): void {
    this.entities = {};
    this.npcs = {};
    this.resources = {};
    this.buildings = {};
    this.spatialGrid.clear();
  }

  /**
   * Gets entities within a radius with precise distance check.
   *
   * Uses spatial grid for broad-phase query, then performs precise
   * distance calculation to filter results.
   *
   * @param position - Center point of query
   * @param radius - Search radius in world units
   * @returns Array of entities within the exact radius
   */
  public getEntitiesInRange(position: Vector2, radius: number): Entity[] {
    const ids = this.spatialGrid.query(position, radius);
    const entities: Entity[] = [];

    for (const id of ids) {
      const entity = this.entities[id];
      if (entity) {
        // Precise distance check
        const dx = entity.position.x - position.x;
        const dy = entity.position.y - position.y;
        if (dx * dx + dy * dy <= radius * radius) {
          entities.push(entity);
        }
      }
    }

    return entities;
  }
}
