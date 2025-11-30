import type { Entity } from '../types/world';

export const ENTITY_ICONS = {
  NPC: '👨‍🌾',
  BUILDING: '🏛️',
  RESOURCE: '🪵',
  UNKNOWN: '❓',
  // Trees
  TREE: '🌲',
  OAK_TREE: '🌳',
  PINE_TREE: '🌲',
  APPLE_TREE: '🍎',
  // Ores and minerals
  ROCK: '🪨',
  STONE: '🗿',
  ORE: '⛏️',
  IRON_ORE: '⚙️',
  COPPER_ORE: '🟠',
  GOLD_ORE: '🟡',
  COAL_ORE: '⚫',
  CLAY: '🟤',
  CRYSTAL: '💎',
  // Food & Flora
  FOOD: '🌾',
  BERRY: '🫐',
  BERRIES: '🍇',
  WHEAT: '🌾',
  GRAIN: '🌽',
  MUSHROOM: '🍄',
  FLOWER: '🌸',
  HERB: '🌿',
  FIBER: '🧵',
  // Wood & Logs
  WOOD: '🪵',
  LOG: '🪵',
  // Water
  WATER: '💧',
} as const;

export const ENTITY_COLORS = {
  NPC: '#4CAF50',
  BUILDING: '#FFC107',
  RESOURCE: '#2196F3',
  UNKNOWN: '#9E9E9E',
  // Resource-specific colors
  TREE: '#8B4513',      // Brown for trees
  ROCK: '#808080',      // Gray for rocks
  ORE: '#B8860B',       // Dark golden for ores
  WOOD: '#A0522D',      // Sienna for wood
  FOOD: '#FF6B6B',      // Red for food/berries
  FLORA: '#90EE90',     // Light green for plants
  WATER: '#4169E1',     // Royal blue for water
  CRYSTAL: '#E0B0FF',   // Mauve for crystals
} as const;

// Resource type mapping for icons and colors
const RESOURCE_TYPE_MAP: Record<string, { icon: string; color: string }> = {
  // Trees
  'oak_tree': { icon: ENTITY_ICONS.OAK_TREE, color: ENTITY_COLORS.TREE },
  'pine_tree': { icon: ENTITY_ICONS.PINE_TREE, color: ENTITY_COLORS.TREE },
  'apple_tree': { icon: ENTITY_ICONS.APPLE_TREE, color: ENTITY_COLORS.TREE },
  'tree': { icon: ENTITY_ICONS.TREE, color: ENTITY_COLORS.TREE },
  
  // Wood & Logs
  'wood': { icon: ENTITY_ICONS.WOOD, color: ENTITY_COLORS.WOOD },
  'fallen_log': { icon: ENTITY_ICONS.LOG, color: ENTITY_COLORS.WOOD },
  
  // Rocks and basic minerals
  'rock': { icon: ENTITY_ICONS.ROCK, color: ENTITY_COLORS.ROCK },
  'stone': { icon: ENTITY_ICONS.STONE, color: ENTITY_COLORS.ROCK },
  'loose_stones': { icon: ENTITY_ICONS.ROCK, color: ENTITY_COLORS.ROCK },
  
  // Ores
  'iron_ore': { icon: ENTITY_ICONS.IRON_ORE, color: ENTITY_COLORS.ORE },
  'copper_ore': { icon: ENTITY_ICONS.COPPER_ORE, color: ENTITY_COLORS.ORE },
  'gold_ore': { icon: ENTITY_ICONS.GOLD_ORE, color: ENTITY_COLORS.ORE },
  'coal_ore': { icon: ENTITY_ICONS.COAL_ORE, color: ENTITY_COLORS.ORE },
  'ore': { icon: ENTITY_ICONS.ORE, color: ENTITY_COLORS.ORE },
  
  // Clay & Crystals
  'clay_patch': { icon: ENTITY_ICONS.CLAY, color: ENTITY_COLORS.ROCK },
  'crystal_blue': { icon: ENTITY_ICONS.CRYSTAL, color: ENTITY_COLORS.CRYSTAL },
  
  // Food - Berries & Fruits
  'bush_berry': { icon: ENTITY_ICONS.BERRY, color: ENTITY_COLORS.FOOD },
  'berry': { icon: ENTITY_ICONS.BERRY, color: ENTITY_COLORS.FOOD },
  'berries': { icon: ENTITY_ICONS.BERRIES, color: ENTITY_COLORS.FOOD },
  
  // Food - Grains
  'wheat': { icon: ENTITY_ICONS.WHEAT, color: ENTITY_COLORS.FOOD },
  'wild_wheat': { icon: ENTITY_ICONS.WHEAT, color: ENTITY_COLORS.FOOD },
  'grain': { icon: ENTITY_ICONS.GRAIN, color: ENTITY_COLORS.FOOD },
  'food': { icon: ENTITY_ICONS.FOOD, color: ENTITY_COLORS.FOOD },
  
  // Flora - Mushrooms
  'mushroom_red': { icon: ENTITY_ICONS.MUSHROOM, color: ENTITY_COLORS.FOOD },
  'mushroom_brown': { icon: ENTITY_ICONS.MUSHROOM, color: ENTITY_COLORS.FOOD },
  
  // Flora - Plants & Herbs
  'flower_honey': { icon: ENTITY_ICONS.FLOWER, color: ENTITY_COLORS.FLORA },
  'plant_fiber': { icon: ENTITY_ICONS.FIBER, color: ENTITY_COLORS.FLORA },
  'herb_healing': { icon: ENTITY_ICONS.HERB, color: ENTITY_COLORS.FLORA },
  'herb_poison': { icon: ENTITY_ICONS.HERB, color: ENTITY_COLORS.FLORA },
  
  // Water
  'water_source': { icon: ENTITY_ICONS.WATER, color: ENTITY_COLORS.WATER },
};

export const getEntitySymbol = (entity: Entity): string => {
  switch (entity.type) {
    case 'npc': return ENTITY_ICONS.NPC;
    case 'building': return ENTITY_ICONS.BUILDING;
    case 'resource': {
      const resourceType = (entity as any).resourceType?.toLowerCase();
      if (resourceType && RESOURCE_TYPE_MAP[resourceType]) {
        return RESOURCE_TYPE_MAP[resourceType].icon;
      }
      return ENTITY_ICONS.RESOURCE;
    }
    default: return ENTITY_ICONS.UNKNOWN;
  }
};

export const getEntityColor = (entity: Entity): string => {
  switch (entity.type) {
    case 'npc': return ENTITY_COLORS.NPC;
    case 'building': return ENTITY_COLORS.BUILDING;
    case 'resource': {
      const resourceType = (entity as any).resourceType?.toLowerCase();
      if (resourceType && RESOURCE_TYPE_MAP[resourceType]) {
        return RESOURCE_TYPE_MAP[resourceType].color;
      }
      return ENTITY_COLORS.RESOURCE;
    }
    default: return ENTITY_COLORS.UNKNOWN;
  }
};
