export interface Vector2 {
  x: number;
  y: number;
}

export interface Needs {
  hunger: number;
  energy: number;
  social: number;
}

export interface Stats {
  health: number;
  money: number;
  speed: number;
}

export interface Skills {
  gathering: number;
  crafting: number;
  trading: number;
}

export interface ItemProperties {
  volume?: number;
  weight?: number;
  quality?: number;
  durability?: number;
  maxDurability?: number;
  freshness?: number;
}

export interface InventoryItem {
  id: string;
  type: string;
  quantity: number;
  properties?: ItemProperties;
}

export interface Container {
  capacity: number;
  contents: InventoryItem[];
  isOpen: boolean;
}

export interface Entity {
  id: string;
  type: "npc" | "building" | "resource";
  position: Vector2;
  container?: Container;
}

export interface NPC extends Entity {
  type: "npc";
  name: string;
  needs: Needs;
  stats: Stats;
  skills: Skills;
  currentAction: string | null;
  inventory: InventoryItem[];
  ownedBuildingIds: string[];
}

export interface Resource extends Entity {
  type: "resource";
  resourceType: string;
  amount: number;
  properties: {
    value: number;
    edible?: boolean;
    craftingMaterial?: boolean;
  };
}

export interface Building extends Entity {
  type: "building";
  buildingType: string;
  gold: number;
  inventory: InventoryItem[];
}

export type BiomeType = "forest" | "plains" | "desert" | "mountain" | "swamp" | "water";

export interface Tile {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;
  moisture: number;
}

export interface WorldState {
  tick: number;
  time: number;
  width: number;
  height: number;
  tiles: Tile[][];
  npcs: Record<string, NPC>;
  resources: Record<string, Resource>;
  buildings: Record<string, Building>;
}

export interface SimulationStatus {
  paused: boolean;
  speed: number;
  tick: number;
}
