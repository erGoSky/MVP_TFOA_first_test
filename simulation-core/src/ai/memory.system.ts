import { NPC, Entity, Vector2, MemoryItem } from '../types';

export class MemorySystem {
  /**
   * Update NPC memory based on currently visible entities
   */
  updateMemory(npc: NPC, visibleEntities: Entity[], currentTick: number): void {
    if (!npc.memory) {
      npc.memory = {
        locations: new Map(),
        lastSeen: new Map()
      };
    }

    visibleEntities.forEach(entity => {
      // Skip self
      if (entity.id === npc.id) return;

      let subtype = '';
      if (entity.type === 'resource') {
        subtype = (entity as any).resourceType;
      } else if (entity.type === 'building') {
        subtype = (entity as any).buildingType;
      } else if (entity.container) {
        // Containers might be buildings or separate entities, handle generic containers
        // For now, we mainly care about resources and buildings
      }

      if (!subtype) return;

      const memoryItem: MemoryItem = {
        id: entity.id,
        type: entity.type as 'resource' | 'building',
        subtype,
        position: { ...entity.position }, // Copy position
        timestamp: currentTick
      };

      // Update location memory
      npc.memory.locations.set(entity.id, memoryItem);
      
      // Update last seen timestamp for this subtype
      npc.memory.lastSeen.set(subtype, currentTick);
    });
  }

  /**
   * Find a known location for a specific type of entity
   */
  findLocation(npc: NPC, type: 'resource' | 'building', subtype: string): Vector2 | null {
    if (!npc.memory || !npc.memory.locations) return null;

    // Find all memories matching the criteria
    const candidates: MemoryItem[] = [];
    for (const item of npc.memory.locations.values()) {
      if (item.type === type && item.subtype === subtype) {
        candidates.push(item);
      }
    }

    if (candidates.length === 0) return null;

    // Sort by distance (closest first)
    candidates.sort((a, b) => {
      const distA = this.getDistance(npc.position, a.position);
      const distB = this.getDistance(npc.position, b.position);
      return distA - distB;
    });

    return candidates[0].position;
  }

  /**
   * Remove a specific entity from memory (e.g., if it's gone)
   */
  forgetLocation(npc: NPC, entityId: string): void {
    if (npc.memory && npc.memory.locations) {
      npc.memory.locations.delete(entityId);
    }
  }

  private getDistance(a: Vector2, b: Vector2): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
