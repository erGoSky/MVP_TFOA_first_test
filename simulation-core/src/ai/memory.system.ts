import { NPC, Entity, Vector2, MemoryItem } from "../types";

export class MemorySystem {
  // Track previous visibility for session detection: npcId -> Set<entityId>
  private prevVisible: Map<string, Set<string>> = new Map();

  /**
   * Update NPC memory based on currently visible entities
   */
  updateMemory(npc: NPC, visibleEntities: Entity[], currentTick: number): void {
    if (!npc.memory) {
      npc.memory = {
        locations: new Map(),
        lastSeen: new Map(),
      };
    }

    // Initialize previous visibility set for this NPC if needed
    if (!this.prevVisible.has(npc.id)) {
      this.prevVisible.set(npc.id, new Set());
    }
    const prevVisibleSet = this.prevVisible.get(npc.id)!;
    const currentVisibleSet = new Set<string>();

    visibleEntities.forEach((entity) => {
      // Skip self
      if (entity.id === npc.id) return;

      let subtype = "";
      if (entity.type === "resource") {
        subtype = (entity as any).resourceType;
      } else if (entity.type === "building") {
        subtype = (entity as any).buildingType;
      } else if (entity.container) {
        // Containers might be buildings or separate entities
      }

      if (!subtype) return;

      currentVisibleSet.add(entity.id);

      // Check if this is a new session (entering visibility)
      const isNewSession = !prevVisibleSet.has(entity.id);

      let memoryItem = npc.memory.locations.get(entity.id);

      if (!memoryItem) {
        // First encounter
        memoryItem = {
          id: entity.id,
          type: entity.type as "resource" | "building",
          subtype,
          position: { ...entity.position },
          timestamp: currentTick,
          interactionCount: 1,
          retentionDuration: 1, // Base: 1 tick
          expiryTick: currentTick + 1,
          forgotten: false,
        };
      } else {
        // Update existing memory
        memoryItem.position = { ...entity.position };
        memoryItem.timestamp = currentTick;
        memoryItem.forgotten = false; // Remembered again

        if (isNewSession) {
          // Reinforcement on new session
          memoryItem.interactionCount++;
          const memorySkill = npc.skills.memory || 1;
          const multiplier = 1 + 0.2 * memorySkill;
          memoryItem.retentionDuration = Math.ceil(memoryItem.retentionDuration * multiplier);
        }

        // Update expiry based on current tick and (possibly updated) duration
        memoryItem.expiryTick = currentTick + memoryItem.retentionDuration;
      }

      // Save back to memory
      npc.memory.locations.set(entity.id, memoryItem);
      npc.memory.lastSeen.set(subtype, currentTick);
    });

    // Update previous visibility set for next tick
    this.prevVisible.set(npc.id, currentVisibleSet);

    // Process forgetting (expiry check)
    this.processForgetting(npc, currentTick);
  }

  /**
   * Check for expired memories and mark them as forgotten
   */
  private processForgetting(npc: NPC, currentTick: number): void {
    if (!npc.memory || !npc.memory.locations) return;

    for (const item of npc.memory.locations.values()) {
      if (!item.forgotten && currentTick > item.expiryTick) {
        item.forgotten = true;
        // console.log(`[Memory] NPC ${npc.name} forgot ${item.subtype} (ID: ${item.id})`);
      }
    }
  }

  /**
   * Get all valid (non-forgotten) memories
   */
  getValidMemories(npc: NPC): MemoryItem[] {
    if (!npc.memory || !npc.memory.locations) return [];
    return Array.from(npc.memory.locations.values()).filter((item) => !item.forgotten);
  }

  /**
   * Find a known location for a specific type of entity
   */
  findLocation(npc: NPC, type: "resource" | "building", subtype: string): Vector2 | null {
    const validMemories = this.getValidMemories(npc);
    const candidates = validMemories.filter(
      (item) => item.type === type && item.subtype === subtype
    );

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
