/**
 * Centralized Entity Constants
 * Single source of truth for all entity types, resource types, and their metadata
 */

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export const RESOURCE_TYPES = {
  // Trees
  TREE_OAK: "tree_oak",
  TREE_PINE: "tree_pine",
  TREE_APPLE: "tree_apple",

  // Minerals & Ores
  ROCK_STONE: "rock_stone",
  ORE_IRON: "ore_iron",
  ORE_COAL: "ore_coal",
  ORE_GOLD: "ore_gold",

  // Plants & Flora
  BUSH_BERRY: "bush_berry",
  WILD_WHEAT: "wild_wheat",
  MUSHROOM_RED: "mushroom_red",
  MUSHROOM_BROWN: "mushroom_brown",
  FLOWER_HONEY: "flower_honey",
  HERB_HEALING: "herb_healing",
  PLANT_FIBER: "plant_fiber",

  // Other Resources
  CLAY_PATCH: "clay_patch",
  WATER_SOURCE: "water_source",
  CRYSTAL_BLUE: "crystal_blue",
  FALLEN_LOG: "fallen_log",
  LOOSE_STONES: "loose_stones",
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

// ============================================================================
// BIOME TYPES
// ============================================================================

export const BIOME_TYPES = {
  FOREST: "forest",
  PLAINS: "plains",
  DESERT: "desert",
  MOUNTAIN: "mountain",
  SWAMP: "swamp",
  WATER: "water",
} as const;

export type BiomeType = (typeof BIOME_TYPES)[keyof typeof BIOME_TYPES];

// ============================================================================
// BUILDING TYPES
// ============================================================================

export const BUILDING_TYPES = {
  TAVERN: "tavern",
  HOUSE_SMALL: "house_small",
  HOUSE_LARGE: "house_large",
  SHOP: "shop",
  WORKSHOP: "workshop",
} as const;

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

// ============================================================================
// CONTAINER TYPES
// ============================================================================

export const CONTAINER_TYPES = {
  CHEST_SMALL: "chest_small",
  CHEST_LARGE: "chest_large",
  CRATE: "crate",
  BARREL: "barrel",
} as const;

export type ContainerType = (typeof CONTAINER_TYPES)[keyof typeof CONTAINER_TYPES];

// ============================================================================
// WORKSTATION TYPES
// ============================================================================

export const WORKSTATION_TYPES = {
  CRAFTING_TABLE: "crafting_table",
  FURNACE: "furnace",
  ANVIL: "anvil",
  LOOM: "loom",
} as const;

export type WorkstationType = (typeof WORKSTATION_TYPES)[keyof typeof WORKSTATION_TYPES];

// ============================================================================
// WORKSTATION METADATA
// ============================================================================

export interface WorkstationMetadata {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const WORKSTATION_METADATA: Record<WorkstationType, WorkstationMetadata> = {
  [WORKSTATION_TYPES.CRAFTING_TABLE]: {
    name: "Crafting Table",
    icon: "🔨",
    color: "#8B4513",
    description: "Basic crafting station for tools and items",
  },
  [WORKSTATION_TYPES.FURNACE]: {
    name: "Furnace",
    icon: "🔥",
    color: "#FF4500",
    description: "Smelts ores into ingots",
  },
  [WORKSTATION_TYPES.ANVIL]: {
    name: "Anvil",
    icon: "⚒️",
    color: "#696969",
    description: "Forges metal items and repairs tools",
  },
  [WORKSTATION_TYPES.LOOM]: {
    name: "Loom",
    icon: "🧵",
    color: "#DEB887",
    description: "Weaves cloth and fabric items",
  },
};

// ============================================================================
// RESOURCE METADATA
// ============================================================================

export interface ResourceMetadata {
  name: string;
  category: "tree" | "ore" | "plant" | "mineral" | "liquid" | "other";
  icon: string;
  color: string;
  edible?: boolean;
  nutrition?: number;
  craftingMaterial?: boolean;
  value: number;
}

export const RESOURCE_METADATA: Record<ResourceType, ResourceMetadata> = {
  // Trees
  [RESOURCE_TYPES.TREE_OAK]: {
    name: "Oak Tree",
    category: "tree",
    icon: "🌳",
    color: "#8B4513",
    craftingMaterial: true,
    value: 5,
  },
  [RESOURCE_TYPES.TREE_PINE]: {
    name: "Pine Tree",
    category: "tree",
    icon: "🌲",
    color: "#8B4513",
    craftingMaterial: true,
    value: 5,
  },
  [RESOURCE_TYPES.TREE_APPLE]: {
    name: "Apple Tree",
    category: "tree",
    icon: "🍎",
    color: "#8B4513",
    edible: true,
    nutrition: 0.3,
    value: 4,
  },

  // Minerals & Ores
  [RESOURCE_TYPES.ROCK_STONE]: {
    name: "Stone",
    category: "mineral",
    icon: "🗿",
    color: "#808080",
    craftingMaterial: true,
    value: 1,
  },
  [RESOURCE_TYPES.ORE_IRON]: {
    name: "Iron Ore",
    category: "ore",
    icon: "⚙️",
    color: "#B8860B",
    craftingMaterial: true,
    value: 15,
  },
  [RESOURCE_TYPES.ORE_COAL]: {
    name: "Coal Ore",
    category: "ore",
    icon: "⚫",
    color: "#B8860B",
    craftingMaterial: true,
    value: 8,
  },
  [RESOURCE_TYPES.ORE_GOLD]: {
    name: "Gold Ore",
    category: "ore",
    icon: "🟡",
    color: "#B8860B",
    craftingMaterial: true,
    value: 50,
  },

  // Plants & Flora
  [RESOURCE_TYPES.BUSH_BERRY]: {
    name: "Berry Bush",
    category: "plant",
    icon: "🫐",
    color: "#FF6B6B",
    edible: true,
    nutrition: 0.2,
    value: 2,
  },
  [RESOURCE_TYPES.WILD_WHEAT]: {
    name: "Wild Wheat",
    category: "plant",
    icon: "🌾",
    color: "#FF6B6B",
    edible: true,
    nutrition: 0.1,
    value: 2,
  },
  [RESOURCE_TYPES.MUSHROOM_RED]: {
    name: "Red Mushroom",
    category: "plant",
    icon: "🍄",
    color: "#FF6B6B",
    edible: true,
    nutrition: 0.1,
    value: 3,
  },
  [RESOURCE_TYPES.MUSHROOM_BROWN]: {
    name: "Brown Mushroom",
    category: "plant",
    icon: "🍄",
    color: "#FF6B6B",
    edible: true,
    nutrition: 0.15,
    value: 3,
  },
  [RESOURCE_TYPES.FLOWER_HONEY]: {
    name: "Honey Flower",
    category: "plant",
    icon: "🌸",
    color: "#90EE90",
    value: 5,
  },
  [RESOURCE_TYPES.HERB_HEALING]: {
    name: "Healing Herb",
    category: "plant",
    icon: "🌿",
    color: "#90EE90",
    value: 10,
  },
  [RESOURCE_TYPES.PLANT_FIBER]: {
    name: "Plant Fiber",
    category: "plant",
    icon: "🧵",
    color: "#90EE90",
    craftingMaterial: true,
    value: 1,
  },

  // Other Resources
  [RESOURCE_TYPES.CLAY_PATCH]: {
    name: "Clay Patch",
    category: "mineral",
    icon: "🟤",
    color: "#808080",
    craftingMaterial: true,
    value: 2,
  },
  [RESOURCE_TYPES.WATER_SOURCE]: {
    name: "Water Source",
    category: "liquid",
    icon: "💧",
    color: "#4169E1",
    edible: true,
    nutrition: 0.05,
    value: 0,
  },
  [RESOURCE_TYPES.CRYSTAL_BLUE]: {
    name: "Blue Crystal",
    category: "mineral",
    icon: "💎",
    color: "#E0B0FF",
    value: 100,
  },
  [RESOURCE_TYPES.FALLEN_LOG]: {
    name: "Fallen Log",
    category: "other",
    icon: "🪵",
    color: "#A0522D",
    craftingMaterial: true,
    value: 2,
  },
  [RESOURCE_TYPES.LOOSE_STONES]: {
    name: "Loose Stones",
    category: "mineral",
    icon: "🪨",
    color: "#808080",
    craftingMaterial: true,
    value: 1,
  },
};

// ============================================================================
// BIOME METADATA
// ============================================================================

export interface BiomeMetadata {
  name: string;
  color: string;
  description: string;
}

export const BIOME_METADATA: Record<BiomeType, BiomeMetadata> = {
  [BIOME_TYPES.FOREST]: {
    name: "Forest",
    color: "#2E8B57",
    description: "Dense woodland with abundant trees and flora",
  },
  [BIOME_TYPES.PLAINS]: {
    name: "Plains",
    color: "#90EE90",
    description: "Open grasslands with scattered vegetation",
  },
  [BIOME_TYPES.DESERT]: {
    name: "Desert",
    color: "#F4A460",
    description: "Arid wasteland with sparse resources",
  },
  [BIOME_TYPES.MOUNTAIN]: {
    name: "Mountain",
    color: "#808080",
    description: "Rocky highlands rich in minerals",
  },
  [BIOME_TYPES.SWAMP]: {
    name: "Swamp",
    color: "#556B2F",
    description: "Wetlands with unique plants and herbs",
  },
  [BIOME_TYPES.WATER]: {
    name: "Water",
    color: "#4169E1",
    description: "Lakes, rivers, and water bodies",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getResourceMetadata(type: ResourceType): ResourceMetadata {
  return RESOURCE_METADATA[type];
}

export function getBiomeMetadata(type: BiomeType): BiomeMetadata {
  return BIOME_METADATA[type];
}

export function getAllResourceTypes(): ResourceType[] {
  return Object.values(RESOURCE_TYPES);
}

export function getAllBiomeTypes(): BiomeType[] {
  return Object.values(BIOME_TYPES);
}

export function getAllBuildingTypes(): BuildingType[] {
  return Object.values(BUILDING_TYPES);
}
