import { NPC, Resource, Building, Entity, Vector2, Skills, BuildingTemplate } from "../types";
import { PersonalityGenerator } from "../personality/generator";

export class EntityManager {
  private entities: Record<string, Entity> = {};
  private npcs: Record<string, NPC> = {};
  private resources: Record<string, Resource> = {};
  private buildings: Record<string, Building> = {};

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

    console.log(
      `Created NPC ${name} with personality: ${PersonalityGenerator.describe(npc.personality)} (${
        npc.personality.archetype
      })`
    );
    return npc;
  }

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
    return res;
  }

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
    return building;
  }

  public removeEntity(id: string): void {
    const entity = this.entities[id];
    if (!entity) return;

    if (entity.type === "npc") delete this.npcs[id];
    else if (entity.type === "resource") delete this.resources[id];
    else if (entity.type === "building") delete this.buildings[id];

    delete this.entities[id];
    console.log(`Entity removed: ${id}`);
  }

  public updateEntity(id: string, updates: Partial<any>): void {
    const entity = this.entities[id];
    if (!entity) return;

    Object.assign(entity, updates);

    if (entity.type === "npc") Object.assign(this.npcs[id], updates);
    else if (entity.type === "resource") Object.assign(this.resources[id], updates);
    else if (entity.type === "building") Object.assign(this.buildings[id], updates);

    console.log(`Entity updated: ${id}`);
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities[id];
  }

  public getNPCs(): NPC[] {
    return Object.values(this.npcs);
  }

  public getResources(): Resource[] {
    return Object.values(this.resources);
  }

  public getBuildings(): Building[] {
    return Object.values(this.buildings);
  }

  public getAllEntities(): Entity[] {
    return Object.values(this.entities);
  }

  public getState() {
    return {
      entities: this.entities,
      npcs: this.npcs,
      resources: this.resources,
      buildings: this.buildings,
    };
  }

  public reset(): void {
    this.entities = {};
    this.npcs = {};
    this.resources = {};
    this.buildings = {};
  }
}
