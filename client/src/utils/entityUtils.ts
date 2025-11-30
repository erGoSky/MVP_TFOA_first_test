import type { Entity } from '../types/world';
import { RESOURCE_METADATA, BIOME_METADATA, type ResourceType } from '../constants/entities';

// Re-export BIOME_METADATA as BIOME_COLORS for backwards compatibility
export const BIOME_COLORS = BIOME_METADATA;

// Entity type colors
export const ENTITY_COLORS = {
  NPC: '#4CAF50',
  BUILDING: '#FFC107',
  RESOURCE: '#2196F3',
  UNKNOWN: '#9E9E9E',
} as const;

// Entity icons for UI components
export const ENTITY_ICONS = {
  NPC: '👨‍🌾',
  BUILDING: '🏛️',
  TREE: '🌲',
  ROCK: '🪨',
  FOOD: '🍎',
  RESOURCE: '🪵',
} as const;


export const getEntitySymbol = (entity: Entity): string => {
  switch (entity.type) {
    case 'npc': return '👨‍🌾';
    case 'building': return '🏛️';
    case 'resource': {
      const resourceType = (entity as any).resourceType as ResourceType;
      const metadata = RESOURCE_METADATA[resourceType];
      return metadata?.icon || '🪵';
    }
    default: return '❓';
  }
};

export const getEntityColor = (entity: Entity): string => {
  switch (entity.type) {
    case 'npc': return ENTITY_COLORS.NPC;
    case 'building': return ENTITY_COLORS.BUILDING;
    case 'resource': {
      const resourceType = (entity as any).resourceType as ResourceType;
      const metadata = RESOURCE_METADATA[resourceType];
      return metadata?.color || ENTITY_COLORS.RESOURCE;
    }
    default: return ENTITY_COLORS.UNKNOWN;
  }
};
