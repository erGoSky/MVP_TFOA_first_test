import {
  RESOURCE_TYPES,
  WORKSTATION_TYPES,
  type ResourceType,
  type WorkstationType,
} from "./entities";

export interface Recipe {
  id: string;
  name: string;
  inputs: { type: ResourceType | string; quantity: number }[];
  output: { type: string; quantity: number };
  requiredWorkstation?: WorkstationType;
  craftingTime: number; // ticks
  skillRequired?: { skill: string; level: number };
}

export const RECIPES: Record<string, Recipe> = {
  // ============================================================================
  // BASIC RECIPES (No Workstation Required)
  // ============================================================================

  stick: {
    id: "stick",
    name: "Stick",
    inputs: [{ type: RESOURCE_TYPES.TREE_OAK, quantity: 1 }],
    output: { type: "stick", quantity: 4 },
    craftingTime: 10,
  },

  rope: {
    id: "rope",
    name: "Rope",
    inputs: [{ type: RESOURCE_TYPES.PLANT_FIBER, quantity: 3 }],
    output: { type: "rope", quantity: 1 },
    craftingTime: 15,
  },

  // ============================================================================
  // CRAFTING TABLE RECIPES
  // ============================================================================

  wooden_pickaxe: {
    id: "wooden_pickaxe",
    name: "Wooden Pickaxe",
    inputs: [
      { type: RESOURCE_TYPES.TREE_OAK, quantity: 3 },
      { type: "stick", quantity: 2 },
    ],
    output: { type: "wooden_pickaxe", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.CRAFTING_TABLE,
    craftingTime: 20,
  },

  wooden_axe: {
    id: "wooden_axe",
    name: "Wooden Axe",
    inputs: [
      { type: RESOURCE_TYPES.TREE_OAK, quantity: 3 },
      { type: "stick", quantity: 2 },
    ],
    output: { type: "wooden_axe", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.CRAFTING_TABLE,
    craftingTime: 20,
  },

  stone_pickaxe: {
    id: "stone_pickaxe",
    name: "Stone Pickaxe",
    inputs: [
      { type: RESOURCE_TYPES.ROCK_STONE, quantity: 3 },
      { type: "stick", quantity: 2 },
    ],
    output: { type: "stone_pickaxe", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.CRAFTING_TABLE,
    craftingTime: 25,
    skillRequired: { skill: "crafting", level: 10 },
  },

  // ============================================================================
  // FURNACE RECIPES (Smelting)
  // ============================================================================

  iron_ingot: {
    id: "iron_ingot",
    name: "Iron Ingot",
    inputs: [
      { type: RESOURCE_TYPES.ORE_IRON, quantity: 1 },
      { type: RESOURCE_TYPES.ORE_COAL, quantity: 1 }, // fuel
    ],
    output: { type: "iron_ingot", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.FURNACE,
    craftingTime: 30,
  },

  gold_ingot: {
    id: "gold_ingot",
    name: "Gold Ingot",
    inputs: [
      { type: RESOURCE_TYPES.ORE_GOLD, quantity: 1 },
      { type: RESOURCE_TYPES.ORE_COAL, quantity: 2 }, // more fuel for gold
    ],
    output: { type: "gold_ingot", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.FURNACE,
    craftingTime: 40,
    skillRequired: { skill: "crafting", level: 15 },
  },

  brick: {
    id: "brick",
    name: "Brick",
    inputs: [
      { type: RESOURCE_TYPES.CLAY_PATCH, quantity: 2 },
      { type: RESOURCE_TYPES.ORE_COAL, quantity: 1 },
    ],
    output: { type: "brick", quantity: 4 },
    requiredWorkstation: WORKSTATION_TYPES.FURNACE,
    craftingTime: 25,
  },

  // ============================================================================
  // ANVIL RECIPES (Forging)
  // ============================================================================

  iron_sword: {
    id: "iron_sword",
    name: "Iron Sword",
    inputs: [
      { type: "iron_ingot", quantity: 2 },
      { type: "stick", quantity: 1 },
    ],
    output: { type: "iron_sword", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.ANVIL,
    craftingTime: 40,
    skillRequired: { skill: "crafting", level: 20 },
  },

  iron_pickaxe: {
    id: "iron_pickaxe",
    name: "Iron Pickaxe",
    inputs: [
      { type: "iron_ingot", quantity: 3 },
      { type: "stick", quantity: 2 },
    ],
    output: { type: "iron_pickaxe", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.ANVIL,
    craftingTime: 35,
    skillRequired: { skill: "crafting", level: 18 },
  },

  iron_armor: {
    id: "iron_armor",
    name: "Iron Armor",
    inputs: [{ type: "iron_ingot", quantity: 8 }],
    output: { type: "iron_armor", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.ANVIL,
    craftingTime: 60,
    skillRequired: { skill: "crafting", level: 25 },
  },

  // ============================================================================
  // LOOM RECIPES (Weaving)
  // ============================================================================

  cloth: {
    id: "cloth",
    name: "Cloth",
    inputs: [{ type: RESOURCE_TYPES.PLANT_FIBER, quantity: 5 }],
    output: { type: "cloth", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.LOOM,
    craftingTime: 20,
  },

  bag: {
    id: "bag",
    name: "Bag",
    inputs: [
      { type: "cloth", quantity: 2 },
      { type: "rope", quantity: 1 },
    ],
    output: { type: "bag", quantity: 1 },
    requiredWorkstation: WORKSTATION_TYPES.LOOM,
    craftingTime: 25,
    skillRequired: { skill: "crafting", level: 10 },
  },
};

// Helper functions
export function getRecipe(id: string): Recipe | undefined {
  return RECIPES[id];
}

export function getAllRecipes(): Recipe[] {
  return Object.values(RECIPES);
}

export function getRecipesByWorkstation(workstation?: WorkstationType): Recipe[] {
  return getAllRecipes().filter((r) => r.requiredWorkstation === workstation);
}
