# Memory System Documentation

## Overview

The Memory System enables NPCs to remember past experiences, resource locations, and interactions, creating more intelligent and believable behavior patterns.

## Core Concepts

NPCs have **limited, imperfect memory** that:
- Stores important information (resource locations, successful actions)
- Decays over time (old memories become unreliable)
- Influences future decisions (prefer known good options)
- Creates emergent behaviors (NPCs develop "favorite" spots)

## Memory Types

### 1. Resource Location Memory

NPCs remember where they've seen resources:

```typescript
interface ResourceMemory {
  resourceType: string;
  locations: Array<{
    position: Position;
    lastSeen: number;        // Tick when spotted
    reliability: number;     // 0-1, decays over time
    lastAttempted: number;   // Tick when last tried to gather
    successRate: number;     // 0-1, based on past attempts
  }>;
}
```

**Example:**
```
NPC spots tree_oak at (45, 67) on tick 100
→ Stores in memory with reliability=1.0
→ Tick 200: reliability decays to 0.8
→ Tick 300: reliability decays to 0.6
→ Tick 400: NPC returns, tree still there → reliability boosted to 0.9
```

### 2. Action History

NPCs remember recent actions and outcomes:

```typescript
interface ActionMemory {
  action: string;
  tick: number;
  success: boolean;
  context: {
    needs: Needs;
    money: number;
    location: Position;
  };
  reward: number;  // Utility gained
}

interface NPCMemory {
  actionHistory: ActionMemory[];  // Last 50 actions
}
```

**Use Cases:**
- Avoid repeating failed actions
- Prefer actions with high past rewards
- Learn optimal times for actions (e.g., sleep when energy < 0.3)

### 3. Spatial Memory

NPCs remember where they've been:

```typescript
interface SpatialMemory {
  visitedLocations: Set<string>;  // "x,y" coordinates
  exploredTiles: number;          // Count for exploration goals
  landmarks: Map<string, Position>; // "tavern", "home", "favorite_tree"
}
```

**Benefits:**
- Avoid revisiting same areas repeatedly
- Track exploration progress
- Navigate to known landmarks

### 4. Social Memory (Future)

NPCs remember interactions with other NPCs:

```typescript
interface SocialMemory {
  relationships: Map<string, {
    npcId: string;
    affinity: number;        // -1 to 1
    trust: number;           // 0 to 1
    lastInteraction: number;
    sharedHistory: InteractionEvent[];
  }>;
}
```

## Implementation

### Data Structures

```typescript
// memory/memory-types.ts
export interface NPCMemory {
  knownResources: Map<string, ResourceMemory>;
  actionHistory: ActionMemory[];
  visitedLocations: Set<string>;
  landmarks: Map<string, Position>;
  relationships?: Map<string, Relationship>;  // Future
}

// Add to NPC interface
interface NPC extends Entity {
  // ... other fields
  memory: NPCMemory;
}
```

### Memory Manager

```typescript
// memory/memory-manager.ts
export class MemoryManager {
  /**
   * Store a new memory event
   */
  remember(npc: NPC, event: MemoryEvent): void {
    switch (event.type) {
      case 'resource_spotted':
        this.rememberResource(npc, event);
        break;
      case 'action_completed':
        this.rememberAction(npc, event);
        break;
      case 'location_visited':
        this.rememberLocation(npc, event);
        break;
    }
  }
  
  /**
   * Retrieve relevant memories
   */
  recall(npc: NPC, query: MemoryQuery): any {
    if (query.type === 'resource_location') {
      return this.recallResourceLocations(npc, query.resourceType);
    }
    if (query.type === 'action_success') {
      return this.recallActionSuccess(npc, query.action);
    }
  }
  
  /**
   * Decay old memories
   */
  decay(npc: NPC, currentTick: number): void {
    // Decay resource reliability
    npc.memory.knownResources.forEach(memory => {
      memory.locations.forEach(loc => {
        const age = currentTick - loc.lastSeen;
        const decayRate = 0.001; // 0.1% per tick
        loc.reliability = Math.max(0, loc.reliability - (age * decayRate));
      });
      
      // Remove unreliable memories
      memory.locations = memory.locations.filter(loc => loc.reliability > 0.2);
    });
    
    // Trim action history to last 50
    if (npc.memory.actionHistory.length > 50) {
      npc.memory.actionHistory = npc.memory.actionHistory.slice(-50);
    }
  }
  
  private rememberResource(npc: NPC, event: ResourceSpottedEvent): void {
    const { resourceType, position } = event;
    
    if (!npc.memory.knownResources.has(resourceType)) {
      npc.memory.knownResources.set(resourceType, {
        resourceType,
        locations: []
      });
    }
    
    const memory = npc.memory.knownResources.get(resourceType)!;
    
    // Check if location already known
    const existing = memory.locations.find(loc => 
      this.isSamePosition(loc.position, position)
    );
    
    if (existing) {
      // Refresh memory
      existing.lastSeen = event.tick;
      existing.reliability = Math.min(1, existing.reliability + 0.2);
    } else {
      // New location
      memory.locations.push({
        position,
        lastSeen: event.tick,
        reliability: 1.0,
        lastAttempted: 0,
        successRate: 0.5  // Neutral assumption
      });
    }
  }
  
  private rememberAction(npc: NPC, event: ActionCompletedEvent): void {
    npc.memory.actionHistory.push({
      action: event.action,
      tick: event.tick,
      success: event.success,
      context: {
        needs: { ...npc.needs },
        money: npc.stats.money,
        location: { ...npc.position }
      },
      reward: event.reward || 0
    });
  }
}
```

## Integration with Decision-Making

### Resource Gathering with Memory

```typescript
// world.ts
private getResourceOptions(npc: NPC): ActionOption[] {
  const options: ActionOption[] = [];
  
  // 1. Check memory for known resources
  npc.memory.knownResources.forEach((memory, resourceType) => {
    memory.locations
      .filter(loc => loc.reliability > 0.5)  // Only reliable memories
      .sort((a, b) => b.reliability - a.reliability)  // Best first
      .slice(0, 3)  // Top 3 locations
      .forEach(loc => {
        const distance = this.getDistance(npc.position, loc.position);
        
        options.push({
          name: `goto_and_pickup:${resourceType}:${loc.position.x},${loc.position.y}`,
          type: 'pickup',
          params: {
            resource_type: resourceType,
            position: loc.position,
            distance: distance,
            confidence: loc.reliability,
            value: this.calculateResourceValue(resourceType, npc)
          }
        });
      });
  });
  
  // 2. Add nearby visible resources
  const visible = this.findEntitiesInRadius(npc.position, VISION_RADIUS, 'resource');
  visible.forEach(r => {
    // Update memory
    this.memoryManager.remember(npc, {
      type: 'resource_spotted',
      resourceType: r.resourceType,
      position: r.position,
      tick: this.state.tick
    });
    
    options.push({
      name: `pickup:${r.id}`,
      type: 'pickup',
      params: {
        resource_type: r.resourceType,
        distance: this.getDistance(npc.position, r.position),
        confidence: 1.0,  // Currently visible
        value: this.calculateResourceValue(r.resourceType, npc)
      }
    });
  });
  
  return options;
}
```

### Learning from Action History

```typescript
// ai-service/main.py
def apply_learning_bonus(action, npc_state):
    """
    Boost utility for actions that succeeded in similar contexts
    """
    similar_actions = [
        a for a in npc_state.memory.actionHistory
        if a.action == action.name and a.success
    ]
    
    if len(similar_actions) > 0:
        avg_reward = sum(a.reward for a in similar_actions) / len(similar_actions)
        success_rate = len([a for a in similar_actions if a.success]) / len(similar_actions)
        
        # Boost utility based on past success
        learning_bonus = avg_reward * success_rate * 0.3
        return learning_bonus
    
    return 0
```

## Memory Decay

### Decay Formula

```typescript
// Exponential decay
reliability(t) = reliability(0) * e^(-λ * age)

// Linear decay (simpler)
reliability(t) = max(0, reliability(0) - (decayRate * age))
```

### Decay Rates

| Memory Type | Decay Rate | Half-Life |
|-------------|------------|-----------|
| Resource Location | 0.001/tick | ~700 ticks |
| Action History | No decay (FIFO) | N/A |
| Spatial Memory | No decay | Permanent |
| Social Memory | 0.0005/tick | ~1400 ticks |

### Memory Refresh

Memories are refreshed when:
- Resource spotted again → reliability boosted
- Action repeated successfully → success rate updated
- Location revisited → marked as visited again

## Examples

### Example 1: Resource Gathering Pattern

```
Tick 100: NPC spots tree_oak at (50, 50)
  → Memory: tree_oak → [(50,50), reliability=1.0]

Tick 150: NPC needs wood, checks memory
  → Recalls tree_oak at (50, 50) with reliability=0.95
  → Travels to (50, 50), gathers wood successfully
  → Updates: lastAttempted=150, successRate=1.0, reliability=1.0

Tick 500: NPC needs wood again
  → Recalls tree_oak at (50, 50) with reliability=0.65 (decayed)
  → Travels to (50, 50), tree is gone
  → Updates: successRate=0.5, reliability=0.3

Tick 600: NPC needs wood
  → Recalls tree_oak at (50, 50) with reliability=0.2 (low)
  → Ignores (below threshold), explores for new trees instead
```

### Example 2: Action Learning

```
Tick 50: NPC tries "work" action
  → Earns 10 gold, reward=0.5
  → Memory: [action="work", success=true, reward=0.5]

Tick 100: NPC tries "work" again
  → Earns 10 gold, reward=0.5
  → Memory: [action="work", success=true, reward=0.5] (x2)

Tick 150: NPC deciding between "work" and "explore"
  → "work" has 100% success rate, avg reward=0.5
  → Learning bonus: 0.5 * 1.0 * 0.3 = 0.15
  → "work" utility boosted by 0.15
  → NPC chooses "work" (learned preference)
```

## Performance

- **Memory per NPC:** ~1 KB
  - Resource locations: ~500 bytes (10 types × 5 locations × 10 bytes)
  - Action history: ~400 bytes (50 actions × 8 bytes)
  - Spatial memory: ~100 bytes (100 tiles × 1 byte)
- **Decay computation:** O(n) where n = number of memories
- **Lookup:** O(1) for hash maps, O(n) for arrays

## Testing

```typescript
describe('MemoryManager', () => {
  it('stores and retrieves resource memories', () => {
    const npc = createNPC();
    memoryManager.remember(npc, {
      type: 'resource_spotted',
      resourceType: 'tree_oak',
      position: { x: 50, y: 50 },
      tick: 100
    });
    
    const memories = memoryManager.recall(npc, {
      type: 'resource_location',
      resourceType: 'tree_oak'
    });
    
    expect(memories.length).toBe(1);
    expect(memories[0].position).toEqual({ x: 50, y: 50 });
    expect(memories[0].reliability).toBe(1.0);
  });
  
  it('decays old memories', () => {
    const npc = createNPC();
    memoryManager.remember(npc, {
      type: 'resource_spotted',
      resourceType: 'tree_oak',
      position: { x: 50, y: 50 },
      tick: 100
    });
    
    memoryManager.decay(npc, 800);  // 700 ticks later
    
    const memories = memoryManager.recall(npc, {
      type: 'resource_location',
      resourceType: 'tree_oak'
    });
    
    expect(memories[0].reliability).toBeLessThan(0.6);
  });
});
```

## Future Enhancements

1. **Episodic Memory:** Remember specific events ("I was attacked at (30, 40)")
2. **Semantic Memory:** General knowledge ("Taverns sell food")
3. **Shared Memory:** NPCs share information through conversation
4. **Memory Consolidation:** Important memories become permanent
5. **False Memories:** Occasionally remember things incorrectly

## References

- [Memory in AI Agents](https://www.gamedeveloper.com/design/giving-your-ai-a-memory)
- [Cognitive Architecture](https://en.wikipedia.org/wiki/Cognitive_architecture)
- [Forgetting Curve](https://en.wikipedia.org/wiki/Forgetting_curve)
