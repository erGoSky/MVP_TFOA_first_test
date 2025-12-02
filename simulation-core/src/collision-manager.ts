import { Vector2, NPC, Resource, Building, WorldState, EntityProperties } from "./types";

export class CollisionManager {
  private worldState: WorldState;
  private occupiedTiles: Map<string, string[]>; // "x,y" => [entityId1, entityId2, ...]

  constructor(worldState: WorldState) {
    this.worldState = worldState;
    this.occupiedTiles = new Map();
    this.rebuildOccupancyGrid();
  }

  /**
   * Rebuild the occupancy grid from current world state
   */
  rebuildOccupancyGrid(): void {
    this.occupiedTiles.clear();

    // Add NPCs
    Object.values(this.worldState.npcs).forEach((npc) => {
      const tile = this.toTileKey(npc.position);
      this.addToGrid(tile, npc.id);
    });

    // Add resources that block movement
    Object.values(this.worldState.resources).forEach((resource) => {
      if (resource.entityProperties?.blocksMovement) {
        const tiles = this.getEntityTiles(resource.position, resource.entityProperties);
        tiles.forEach((tile) => this.addToGrid(tile, resource.id));
      }
    });

    // Add buildings
    Object.values(this.worldState.buildings).forEach((building) => {
      if (building.entityProperties?.blocksMovement) {
        const tiles = this.getEntityTiles(building.position, building.entityProperties);
        tiles.forEach((tile) => this.addToGrid(tile, building.id));
      }
    });
  }

  /**
   * Check if NPC can move to position
   */
  canMoveTo(pos: Vector2, npcId: string): boolean {
    const tile = this.toTileKey(pos);
    const occupants = this.occupiedTiles.get(tile) || [];

    // Can move if tile is empty or only occupied by self
    return occupants.length === 0 || (occupants.length === 1 && occupants[0] === npcId);
  }

  /**
   * Check if a specific tile is blocked
   */
  isBlocked(pos: Vector2): boolean {
    const tile = this.toTileKey(pos);
    const occupants = this.occupiedTiles.get(tile) || [];
    return occupants.length > 0;
  }

  /**
   * Update NPC position in grid
   */
  updateNPCPosition(npc: NPC, oldPos: Vector2, newPos: Vector2): void {
    const oldTile = this.toTileKey(oldPos);
    const newTile = this.toTileKey(newPos);

    // Remove from old position
    this.removeFromGrid(oldTile, npc.id);

    // Add to new position
    this.addToGrid(newTile, npc.id);
  }

  /**
   * Get all tiles occupied by an entity
   */
  private getEntityTiles(pos: Vector2, properties: EntityProperties): string[] {
    const tiles: string[] = [];
    const { width, height } = properties.size;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tilePos = {
          x: Math.floor(pos.x) + x,
          y: Math.floor(pos.y) + y,
        };
        tiles.push(this.toTileKey(tilePos));
      }
    }

    return tiles;
  }

  /**
   * Convert position to tile key
   */
  private toTileKey(pos: Vector2): string {
    return `${Math.floor(pos.x)},${Math.floor(pos.y)}`;
  }

  /**
   * Add entity to grid
   */
  private addToGrid(tile: string, entityId: string): void {
    if (!this.occupiedTiles.has(tile)) {
      this.occupiedTiles.set(tile, []);
    }
    const occupants = this.occupiedTiles.get(tile)!;
    if (!occupants.includes(entityId)) {
      occupants.push(entityId);
    }
  }

  /**
   * Remove entity from grid
   */
  private removeFromGrid(tile: string, entityId: string): void {
    const occupants = this.occupiedTiles.get(tile);
    if (occupants) {
      const index = occupants.indexOf(entityId);
      if (index > -1) {
        occupants.splice(index, 1);
      }
      if (occupants.length === 0) {
        this.occupiedTiles.delete(tile);
      }
    }
  }

  /**
   * Get occupants of a tile
   */
  getOccupants(pos: Vector2): string[] {
    const tile = this.toTileKey(pos);
    return this.occupiedTiles.get(tile) || [];
  }
}
