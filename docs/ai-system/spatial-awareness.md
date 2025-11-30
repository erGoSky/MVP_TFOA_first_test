# Spatial Awareness & Pathfinding Documentation

## Overview

The Spatial Awareness system gives NPCs intelligent navigation, vision-based perception, and exploration behaviors, making movement feel purposeful and realistic.

## Core Components

### 1. Vision System
### 2. A* Pathfinding
### 3. Exploration Behavior
### 4. Obstacle Avoidance

## Vision System

NPCs can only perceive entities within their vision radius.

### Vision Radius

```typescript
interface NPCVision {
  radius: number;              // Tiles visible (default: 15)
  visibleEntities: Entity[];   // Currently visible
  lastUpdate: number;          // Tick of last update
}

// Add to NPC interface
interface NPC extends Entity {
  // ... other fields
  vision: NPCVision;
}
```

### Vision Update

```typescript
// world.ts
updateVision(npc: NPC): void {
  const VISION_RADIUS = 15;
  
  npc.vision.visibleEntities = this.findEntitiesInRadius(
    npc.position,
    VISION_RADIUS
  );
  
  npc.vision.lastUpdate = this.state.tick;
  
  // Update memory with visible resources
  npc.vision.visibleEntities
    .filter(e => e.type === 'resource')
    .forEach(r => {
      this.memoryManager.remember(npc, {
        type: 'resource_spotted',
        resourceType: (r as Resource).resourceType,
        position: r.position,
        tick: this.state.tick
      });
    });
}
```

### Spatial Indexing

For efficient radius queries:

```typescript
// spatial/grid-index.ts
export class SpatialGrid {
  private grid: Map<string, Entity[]>;
  private cellSize: number = 10;  // 10x10 tile cells
  
  insert(entity: Entity): void {
    const cell = this.getCell(entity.position);
    if (!this.grid.has(cell)) {
      this.grid.set(cell, []);
    }
    this.grid.get(cell)!.push(entity);
  }
  
  findInRadius(center: Position, radius: number): Entity[] {
    const cells = this.getCellsInRadius(center, radius);
    const entities: Entity[] = [];
    
    cells.forEach(cell => {
      const cellEntities = this.grid.get(cell) || [];
      cellEntities.forEach(e => {
        if (this.getDistance(center, e.position) <= radius) {
          entities.push(e);
        }
      });
    });
    
    return entities;
  }
  
  private getCell(pos: Position): string {
    const x = Math.floor(pos.x / this.cellSize);
    const y = Math.floor(pos.y / this.cellSize);
    return `${x},${y}`;
  }
}
```

**Performance:** O(n) → O(k) where k = entities in nearby cells

## A* Pathfinding

NPCs navigate around obstacles using A* algorithm.

### Implementation

```typescript
// pathfinding/astar.ts
export class AStarPathfinder {
  findPath(
    start: Position, 
    goal: Position, 
    world: WorldManager
  ): Position[] {
    const openSet = new PriorityQueue<Node>();
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, Position>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    const startKey = this.posKey(start);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start, goal));
    openSet.push({ position: start, f: fScore.get(startKey)! });
    
    while (!openSet.isEmpty()) {
      const current = openSet.pop()!.position;
      const currentKey = this.posKey(current);
      
      // Goal reached
      if (this.isSamePosition(current, goal)) {
        return this.reconstructPath(cameFrom, current);
      }
      
      closedSet.add(currentKey);
      
      // Check neighbors
      const neighbors = this.getNeighbors(current, world);
      for (const neighbor of neighbors) {
        const neighborKey = this.posKey(neighbor);
        
        if (closedSet.has(neighborKey)) continue;
        
        const tentativeG = gScore.get(currentKey)! + this.cost(current, neighbor, world);
        
        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)!) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, goal));
          
          if (!openSet.contains(neighbor)) {
            openSet.push({ position: neighbor, f: fScore.get(neighborKey)! });
          }
        }
      }
    }
    
    return []; // No path found
  }
  
  private heuristic(a: Position, b: Position): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  private cost(from: Position, to: Position, world: WorldManager): number {
    let baseCost = 1;
    
    // Increase cost for obstacles
    if (!this.isWalkable(to, world)) {
      return Infinity;  // Impassable
    }
    
    // Slight cost for occupied tiles
    const entity = world.getEntityAt(to);
    if (entity && entity.type === 'building') {
      baseCost += 5;  // Prefer open paths
    }
    
    return baseCost;
  }
  
  private isWalkable(pos: Position, world: WorldManager): boolean {
    // Check bounds
    if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) {
      return false;
    }
    
    // Check for blocking entities
    const entity = world.getEntityAt(pos);
    if (entity && entity.type === 'building') {
      // Buildings block movement (except doors)
      return false;
    }
    
    return true;
  }
  
  private getNeighbors(pos: Position, world: WorldManager): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: 1 },   // North
      { x: 1, y: 0 },   // East
      { x: 0, y: -1 },  // South
      { x: -1, y: 0 },  // West
      // Diagonals (optional)
      { x: 1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 }
    ];
    
    for (const dir of directions) {
      const neighbor = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (this.isWalkable(neighbor, world)) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }
  
  private reconstructPath(cameFrom: Map<string, Position>, current: Position): Position[] {
    const path: Position[] = [current];
    let currentKey = this.posKey(current);
    
    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey)!;
      path.unshift(current);
      currentKey = this.posKey(current);
    }
    
    return path;
  }
  
  private posKey(pos: Position): string {
    return `${Math.floor(pos.x)},${Math.floor(pos.y)}`;
  }
}
```

### Movement Execution

```typescript
// actions/handlers/movement.handler.ts
export class MovementHandler implements ActionHandler {
  execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
    if (actionType === 'move') {
      const target = this.parseTarget(targetId, world);
      
      if (!target) {
        console.log(`${npc.name} failed to move: invalid target`);
        world.resetAction(npc);
        return;
      }
      
      // Generate path if not exists
      if (!npc.currentPath || npc.currentPath.length === 0) {
        const pathfinder = new AStarPathfinder();
        npc.currentPath = pathfinder.findPath(npc.position, target, world);
        
        if (npc.currentPath.length === 0) {
          console.log(`${npc.name} cannot find path to ${targetId}`);
          world.resetAction(npc);
          return;
        }
      }
      
      // Move along path
      const nextPos = npc.currentPath[0];
      const distance = world.getDistance(npc.position, nextPos);
      
      if (distance <= 1.5) {
        // Reached waypoint
        npc.position = nextPos;
        npc.currentPath.shift();
        
        // Update spatial memory
        world.memoryManager.remember(npc, {
          type: 'location_visited',
          position: nextPos,
          tick: world.state.tick
        });
        
        // Check if reached final destination
        if (npc.currentPath.length === 0) {
          console.log(`${npc.name} reached destination`);
          world.resetAction(npc);
        }
      }
    }
  }
}
```

## Exploration Behavior

NPCs with high curiosity explore unknown areas.

### Exploration Target Selection

```typescript
// behaviors/exploration.ts
export class ExplorationBehavior {
  selectExplorationTarget(npc: NPC, world: WorldManager): Position | null {
    // Only curious NPCs explore
    if (npc.personality.traits.curiosity < 0.5) {
      return null;
    }
    
    const unexplored = this.findUnexploredTiles(npc, world);
    
    if (unexplored.length === 0) {
      return null; // Entire map explored
    }
    
    // Weight by distance and curiosity
    const weighted = unexplored.map(pos => ({
      position: pos,
      score: this.calculateExplorationScore(pos, npc, world)
    }));
    
    weighted.sort((a, b) => b.score - a.score);
    
    return weighted[0].position;
  }
  
  private findUnexploredTiles(npc: NPC, world: WorldManager): Position[] {
    const unexplored: Position[] = [];
    const SAMPLE_RATE = 5;  // Check every 5th tile for performance
    
    for (let x = 0; x < GRID_SIZE; x += SAMPLE_RATE) {
      for (let y = 0; y < GRID_SIZE; y += SAMPLE_RATE) {
        const key = `${x},${y}`;
        if (!npc.memory.visitedLocations.has(key)) {
          unexplored.push({ x, y });
        }
      }
    }
    
    return unexplored;
  }
  
  private calculateExplorationScore(
    pos: Position, 
    npc: NPC, 
    world: WorldManager
  ): number {
    const distance = world.getDistance(npc.position, pos);
    const curiosityBonus = npc.personality.traits.curiosity;
    
    // Prefer closer tiles, but curiosity increases range
    const distancePenalty = distance / (10 * curiosityBonus);
    
    // Bonus for tiles near unexplored clusters
    const clusterBonus = this.getUnexploredNeighborCount(pos, npc) * 0.1;
    
    return (1 / distancePenalty) + clusterBonus;
  }
  
  private getUnexploredNeighborCount(pos: Position, npc: NPC): number {
    let count = 0;
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 5; dy++) {
        const key = `${pos.x + dx},${pos.y + dy}`;
        if (!npc.memory.visitedLocations.has(key)) {
          count++;
        }
      }
    }
    return count;
  }
}
```

### Integration with Decision-Making

```typescript
// world.ts
private getSurvivalOptions(npc: NPC): ActionOption[] {
  const options: ActionOption[] = [
    // ... existing options
  ];
  
  // Add exploration option
  const explorationTarget = this.explorationBehavior.selectExplorationTarget(npc, this);
  if (explorationTarget) {
    options.push({
      name: `explore:${explorationTarget.x},${explorationTarget.y}`,
      type: 'move',
      params: {
        target: explorationTarget,
        value: npc.personality.traits.curiosity * 0.6  // Utility based on curiosity
      }
    });
  }
  
  return options;
}
```

## Performance Optimization

### Path Caching

```typescript
// Cache paths for common destinations
private pathCache = new Map<string, Position[]>();

findPath(start: Position, goal: Position, world: WorldManager): Position[] {
  const key = `${this.posKey(start)}->${this.posKey(goal)}`;
  
  if (this.pathCache.has(key)) {
    return this.pathCache.get(key)!;
  }
  
  const path = this.computePath(start, goal, world);
  this.pathCache.set(key, path);
  
  return path;
}
```

### Lazy Pathfinding

```typescript
// Only compute path when needed, not every tick
if (!npc.currentPath && npc.currentAction?.startsWith('move:')) {
  npc.currentPath = pathfinder.findPath(npc.position, target, world);
}
```

## Debugging

### Visualization (Future)

```typescript
// Render path on map
function renderPath(ctx: CanvasRenderingContext2D, path: Position[]) {
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  path.forEach((pos, i) => {
    const x = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const y = pos.y * CELL_SIZE + CELL_SIZE / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
}
```

## Testing

```typescript
describe('AStarPathfinder', () => {
  it('finds shortest path', () => {
    const start = { x: 0, y: 0 };
    const goal = { x: 10, y: 10 };
    
    const path = pathfinder.findPath(start, goal, world);
    
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);
  });
  
  it('avoids obstacles', () => {
    // Place building at (5, 5)
    world.createBuilding('building_1', 'house', { x: 5, y: 5 });
    
    const start = { x: 0, y: 5 };
    const goal = { x: 10, y: 5 };
    
    const path = pathfinder.findPath(start, goal, world);
    
    // Path should not go through (5, 5)
    expect(path.some(p => p.x === 5 && p.y === 5)).toBe(false);
  });
});
```

## Future Enhancements

1. **Dynamic Obstacles:** Re-path when obstacles appear
2. **Group Movement:** Coordinate movement with other NPCs
3. **Terrain Costs:** Different movement speeds on different terrain
4. **Jump Points:** Optimize pathfinding with jump point search
5. **Flow Fields:** Efficient pathfinding for many NPCs to same goal

## References

- [A* Pathfinding](https://www.redblobgames.com/pathfinding/a-star/introduction.html)
- [Jump Point Search](https://en.wikipedia.org/wiki/Jump_point_search)
- [Flow Fields](https://leifnode.com/2013/12/flow-field-pathfinding/)
