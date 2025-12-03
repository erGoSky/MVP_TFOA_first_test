import { Entity, Vector2 } from "../types";

/**
 * Spatial partitioning grid for efficient proximity queries.
 *
 * The SpatialGrid divides the world into uniform cells and tracks which entities
 * are in each cell. This allows O(1) proximity queries instead of O(n) iteration
 * over all entities.
 *
 * @example
 * ```typescript
 * const grid = new SpatialGrid(20); // 20x20 cell size
 *
 * // Add entities
 * grid.add(npcEntity);
 * grid.add(resourceEntity);
 *
 * // Find all entities within 50 units of position
 * const nearbyIds = grid.query({ x: 100, y: 100 }, 50);
 * ```
 */
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<string>> = new Map();
  private entityPositions: Map<string, Vector2> = new Map();

  /**
   * Creates a new SpatialGrid instance.
   *
   * @param cellSize - Size of each grid cell in world units (default: 20)
   */
  constructor(cellSize: number = 20) {
    this.cellSize = cellSize;
  }

  /**
   * Converts world coordinates to grid cell key.
   * @private
   */
  private getKey(x: number, y: number): string {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return `${gx},${gy}`;
  }

  /**
   * Adds an entity to the spatial grid.
   *
   * @param entity - Entity to add to the grid
   */
  public add(entity: Entity) {
    const key = this.getKey(entity.position.x, entity.position.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(entity.id);
    this.entityPositions.set(entity.id, { ...entity.position });
  }

  /**
   * Removes an entity from the spatial grid.
   *
   * @param entityId - ID of the entity to remove
   */
  public remove(entityId: string) {
    const pos = this.entityPositions.get(entityId);
    if (pos) {
      const key = this.getKey(pos.x, pos.y);
      if (this.grid.has(key)) {
        this.grid.get(key)!.delete(entityId);
        if (this.grid.get(key)!.size === 0) {
          this.grid.delete(key);
        }
      }
      this.entityPositions.delete(entityId);
    }
  }

  /**
   * Updates an entity's position in the spatial grid.
   *
   * If the entity moves to a different grid cell, it is removed from the old cell
   * and added to the new one. If it stays in the same cell, only the position is updated.
   *
   * @param entity - Entity with updated position
   */
  public update(entity: Entity) {
    const oldPos = this.entityPositions.get(entity.id);
    if (!oldPos) {
      this.add(entity);
      return;
    }

    // Check if cell changed
    const oldKey = this.getKey(oldPos.x, oldPos.y);
    const newKey = this.getKey(entity.position.x, entity.position.y);

    if (oldKey !== newKey) {
      this.remove(entity.id);
      this.add(entity);
    } else {
      // Just update stored position
      this.entityPositions.set(entity.id, { ...entity.position });
    }
  }

  /**
   * Queries for all entities within a radius of a position.
   *
   * This performs a broad-phase query by checking all grid cells that intersect
   * with the query circle. For exact distance checks, filter the results further.
   *
   * @param position - Center point of the query
   * @param radius - Search radius in world units
   * @returns Array of entity IDs within the query area (may include entities slightly outside radius)
   *
   * @example
   * ```typescript
   * // Find entities near NPC for AI observation
   * const nearbyIds = grid.query(npc.position, observationRadius);
   * const nearbyEntities = nearbyIds.map(id => entityManager.get(id));
   * ```
   */
  public query(position: Vector2, radius: number): string[] {
    const entityIds: string[] = [];
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        if (this.grid.has(key)) {
          this.grid.get(key)!.forEach((id) => entityIds.push(id));
        }
      }
    }

    return entityIds;
  }

  /**
   * Clears all entities from the spatial grid.
   *
   * This is typically called when the world is reset.
   */
  public clear() {
    this.grid.clear();
    this.entityPositions.clear();
  }
}
