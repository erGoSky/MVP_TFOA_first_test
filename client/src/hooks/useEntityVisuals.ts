import { useMetadata } from '../context/MetadataContext';
import type { Entity, Building } from '../types/world';

export const useEntityVisuals = () => {
  const { resourceMetadata, containerTypes, workstationMetadata, loading } = useMetadata();

  const getEntitySymbol = (entity: Entity): string => {
    // Don't show loading icon, just use fallbacks
    
    switch (entity.type) {
      case 'npc': return '👨‍🌾';
      case 'building': {
        const building = entity as Building;
        const buildingType = building.buildingType;
        
        // Check containers - compare against values
        if (buildingType === 'chest_small' || buildingType === containerTypes?.CHEST_SMALL) return '📦';
        if (buildingType === 'chest_large' || buildingType === containerTypes?.CHEST_LARGE) return '📦';
        if (buildingType === 'crate' || buildingType === containerTypes?.CRATE) return '🟫';
        if (buildingType === 'barrel' || buildingType === containerTypes?.BARREL) return '🛢️';
        
        // Check workstations
        if (workstationMetadata && workstationMetadata[buildingType]) {
          return workstationMetadata[buildingType].icon;
        }
        
        // Hardcoded fallbacks for workstations
        if (buildingType === 'crafting_table') return '🔨';
        if (buildingType === 'furnace') return '🔥';
        if (buildingType === 'anvil') return '⚒️';
        if (buildingType === 'loom') return '🧵';
        
        // Default building
        return '🏛️';
      }
      case 'resource': {
        const resourceType = (entity as any).resourceType;
        
        // Try metadata first
        if (resourceMetadata && resourceMetadata[resourceType]) {
          return resourceMetadata[resourceType].icon;
        }
        
        // Hardcoded fallbacks for common resources
        if (resourceType?.includes('tree')) return '🌲';
        if (resourceType?.includes('ore')) return '⚙️';
        if (resourceType?.includes('rock') || resourceType?.includes('stone')) return '🪨';
        if (resourceType?.includes('berry')) return '🫐';
        if (resourceType?.includes('mushroom')) return '🍄';
        
        return '🪵'; // Default resource icon
      }
      default: return '❓';
    }
  };

  const getEntityColor = (entity: Entity): string => {
    switch (entity.type) {
      case 'npc': return '#4CAF50';
      case 'building': return '#FFC107';
      case 'resource': {
        const resourceType = (entity as any).resourceType;
        if (resourceMetadata && resourceMetadata[resourceType]) {
          return resourceMetadata[resourceType].color;
        }
        return '#2196F3';
      }
      default: return '#9E9E9E';
    }
  };

  return { getEntitySymbol, getEntityColor, loading };
};
