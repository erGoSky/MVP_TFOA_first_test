export interface Vector2 {
  x: number;
  y: number;
}



export interface Needs {
  hunger: number; // 0-1 (0 = full, 1 = starving)
  energy: number; // 0-1 (0 = exhausted, 1 = rested)
  social: number; // 0-1 (0 = lonely, 1 = satisfied)
}

export interface Stats {
  health: number;
  money: number;
  speed: number;
}

export type ItemCategory = 'liquid' | 'bulky' | 'small' | 'loose';

export interface ItemProperties {
  volume?: number;
  weight?: number;
  quality?: number;
  durability?: number;
  maxDurability?: number;
  freshness?: number;
}

export interface EntityProperties {
  blocksMovement: boolean;      // Does it occupy tile completely
  canBeInInventory: boolean;    // Can it be picked up
  canBeInContainer: boolean;    // Can it be stored in chest/barrel
  size: { width: number; height: number };  // Collision box size in tiles
}

export interface WorkContributor {
  npcId: string;
  lastContribution: number;  // Tick when contributed
  totalContribution: number; // Total progress added
}

export interface WorkProgress {
  currentProgress: number;      // 0-100
  requiredProgress: number;     // Usually 100
  actionType: string;           // chop, mine, craft, build, pickup
  contributors: WorkContributor[];
  lastContributorId?: string;   // Who gets the reward
  baseProgressPerTick: number;  // Base value for skill calculation
}

export interface InventoryItem {
  id: string;
  type: string;
  quantity: number;
  category?: ItemCategory;
  properties?: ItemProperties;
  contents?: InventoryItem[]; // For containers
}

export interface Container {
  capacity: number;
  contents: InventoryItem[];
  isOpen: boolean;
}

export interface Entity {
  id: string;
  type: 'npc' | 'resource' | 'building';
  position: Vector2;
  container?: Container; // Optional storage component
}


// Import centralized entity types
import type { BiomeType, ResourceType } from './constants/entities';
export type { BiomeType, ResourceType };


export interface Resource extends Entity {
  type: 'resource';
  resourceType: ResourceType; 
  amount: number;
  harvested: boolean;
  properties: {
    edible?: boolean;
    nutrition?: number;
    craftingMaterial?: boolean;
    value: number; // Base gold value
  };
  entityProperties?: EntityProperties;  // Physical properties
  workProgress?: WorkProgress;          // Current work being done
}

export interface Skills {
    gathering: number;
    crafting: number;
    trading: number;
}

export interface ActionState {
    inProgress: boolean;
    startTime: number;
    duration: number;
}

export type BuildingComponentType = 'wall_stone' | 'wall_log' | 'door_plank' | 'window_plank' | 'roof_hay' | 'roof_leaf';

export interface BuildingComponent {
    type: BuildingComponentType;
    count: number;
}

export interface BuildingTemplate {
    id: string;
    name: string;
    components: BuildingComponent[];
    laborCost: number; // Ticks needed to build
}

export type ContractStatus = 'draft' | 'signed' | 'prepaid' | 'in_progress' | 'completed' | 'paid';
export type ContractType = 'construction';

export interface Contract {
    id: string;
    type: ContractType;
    customerId: string;
    providerId?: string; // Builder
    targetId?: string; // The building ID being built
    templateId?: string; // For construction contracts
    requirements: BuildingComponent[]; // Materials needed
    totalCost: number;
    prepayment: number;
    status: ContractStatus;
    createdAt: number;
}

// Personality System
export interface PersonalityTraits {
  greed: number;           // 0-1: Economic focus vs altruism
  laziness: number;        // 0-1: Work avoidance tendency
  sociability: number;     // 0-1: Social interaction preference
  riskTolerance: number;   // 0-1: Willingness to take risks
  planfulness: number;     // 0-1: Long-term vs short-term thinking
  curiosity: number;       // 0-1: Exploration tendency
}

export interface Personality {
  traits: PersonalityTraits;
  archetype: string;       // "merchant", "hermit", "builder", etc.
}

export enum NPCContextState {
  DESPERATE = 'DESPERATE',    // Critical needs, low resources
  STRUGGLING = 'STRUGGLING',  // One or more needs high
  STABLE = 'STABLE',          // Balanced state
  THRIVING = 'THRIVING'       // All needs met, surplus resources
}

export interface NPCContext {
  state: NPCContextState;
  urgentNeeds: string[];
  opportunities: string[];
}

// Memory System
export interface MemoryItem {
  id: string;
  type: 'resource' | 'building' | 'container';
  subtype: string; // e.g., 'tree_oak', 'tavern'
  position: Vector2;
  timestamp: number; // When this memory was formed/updated
  value?: any; // Optional extra data (e.g., amount remaining)
}

export interface NPCMemory {
  locations: Map<string, MemoryItem>; // Keyed by entity ID
  lastSeen: Map<string, number>; // Keyed by subtype (e.g., 'tree_oak' -> timestamp)
}

export interface NPC extends Entity {
  type: 'npc';
  name: string;
  needs: Needs;
  stats: Stats;
  skills: Skills;
  personality: Personality;
  currentAction: string | null;
  actionState: ActionState;
  inventory: InventoryItem[];
  hands: InventoryItem | null; // Item held in hands
  contracts?: Contract[];
  ownedBuildingIds: string[]; // List of owned buildings
  memory: NPCMemory;
}

export interface Building extends Entity {
  type: 'building';
  buildingType: string; // 'tavern', 'house', 'shop'
  inventory: InventoryItem[]; // Shop stock
  gold: number; // Shop money
  ownerId?: string;
  entityProperties?: EntityProperties;  // Physical properties
  workProgress?: WorkProgress;          // Current construction work
}

export interface Tile {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;
  moisture: number;
}

export interface WorldState {
  tick: number;
  time: number; // Global simulation time
  width: number;
  height: number;
  tiles: Tile[][];
  entities: Record<string, Entity>;
  npcs: Record<string, NPC>;
  resources: Record<string, Resource>;
  buildings: Record<string, Building>;
  contracts: Record<string, Contract>;
}
