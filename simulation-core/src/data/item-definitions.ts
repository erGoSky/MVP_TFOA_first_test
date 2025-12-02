import { ItemCategory, ItemProperties } from "../types";

export interface ItemDefinition {
  id: string;
  category: ItemCategory;
  properties: ItemProperties;
  maxStack?: number;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  // Liquids
  water: {
    id: "water",
    category: "liquid",
    properties: { volume: 1.0, weight: 1.0, quality: 1.0 },
    maxStack: 10, // e.g. 10 liters?
  },
  honey: {
    id: "honey",
    category: "liquid",
    properties: { volume: 0.5, weight: 0.7, quality: 1.0 },
    maxStack: 20,
  },

  // Bulky
  log: {
    id: "log",
    category: "bulky",
    properties: { volume: 10.0, weight: 20.0, durability: 1.0 },
    maxStack: 1,
  },
  stone_block: {
    id: "stone_block",
    category: "bulky",
    properties: { volume: 5.0, weight: 50.0, durability: 1.0 },
    maxStack: 5,
  },

  // Small
  berry: {
    id: "berry",
    category: "small",
    properties: { volume: 0.05, weight: 0.01, freshness: 1.0 },
    maxStack: 100,
  },
  coin: {
    id: "coin",
    category: "small",
    properties: { volume: 0.001, weight: 0.005 },
    maxStack: 1000,
  },

  // Loose
  apple: {
    id: "apple",
    category: "loose",
    properties: { volume: 0.2, weight: 0.15, freshness: 1.0 },
    maxStack: 50,
  },
  stone: {
    id: "stone",
    category: "loose",
    properties: { volume: 0.5, weight: 1.0 },
    maxStack: 20,
  },
  wood: {
    id: "wood",
    category: "loose", // Small pieces of wood
    properties: { volume: 0.5, weight: 0.5 },
    maxStack: 50,
  },

  // Containers
  sack: {
    id: "sack",
    category: "small", // Can be carried
    properties: { volume: 1.0, weight: 0.2 }, // Empty weight
    maxStack: 1,
  },
  barrel: {
    id: "barrel",
    category: "bulky", // Carried in hands
    properties: { volume: 50.0, weight: 10.0 },
    maxStack: 1,
  },
  chest: {
    id: "chest",
    category: "bulky",
    properties: { volume: 100.0, weight: 20.0 },
    maxStack: 1,
  },
};

export function getItemDefinition(type: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[type];
}
