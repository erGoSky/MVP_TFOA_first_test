# Social Dynamics Documentation (Planned Feature)

> **Status:** Deferred - Implementation planned for Phase 4  
> **Dependencies:** Personality System, Memory System

## Overview

The Social Dynamics system will enable NPCs to form relationships, cooperate on tasks, compete for resources, and create emergent social structures within the simulation.

## Design Goals

1. **Emergent Relationships:** Friendships and rivalries form naturally through interactions
2. **Cooperation:** NPCs work together on complex tasks
3. **Social Hierarchy:** Natural leaders and followers emerge
4. **Conflict Resolution:** NPCs negotiate, trade, and resolve disputes
5. **Information Sharing:** NPCs share knowledge about resources and opportunities

## Core Concepts

### Relationship System

```typescript
interface Relationship {
  npcId: string;
  affinity: number;        // -1 (enemy) to 1 (friend)
  trust: number;           // 0 (distrust) to 1 (complete trust)
  lastInteraction: number; // Tick of last interaction
  interactionCount: number;
  sharedHistory: InteractionEvent[];
}

interface InteractionEvent {
  type: 'chat' | 'trade' | 'cooperate' | 'compete' | 'help' | 'betray';
  tick: number;
  outcome: 'positive' | 'neutral' | 'negative';
  context: Record<string, any>;
}
```

### Affinity Calculation

Affinity changes based on interactions:

| Interaction | Affinity Change |
|-------------|----------------|
| Successful trade | +0.1 |
| Cooperation on task | +0.2 |
| Help when in need | +0.3 |
| Chat (compatible personalities) | +0.05 |
| Resource competition | -0.1 |
| Betrayal / theft | -0.5 |
| Repeated negative interactions | -0.2 |

### Personality Compatibility

```typescript
function calculateCompatibility(npc1: NPC, npc2: NPC): number {
  const traits1 = npc1.personality.traits;
  const traits2 = npc2.personality.traits;
  
  // Similar sociability = compatible
  const socialityMatch = 1 - Math.abs(traits1.sociability - traits2.sociability);
  
  // Opposite greed can cause conflict
  const greedConflict = Math.abs(traits1.greed - traits2.greed);
  
  // Similar risk tolerance = compatible
  const riskMatch = 1 - Math.abs(traits1.riskTolerance - traits2.riskTolerance);
  
  return (socialityMatch + riskMatch - greedConflict) / 3;
}
```

## Planned Social Actions

### 1. Chat

**Purpose:** Build relationships through conversation

```typescript
interface ChatAction {
  type: 'chat';
  targetNPC: string;
  duration: number;  // Ticks
  topics: string[];  // 'weather', 'resources', 'gossip', etc.
}

// Effects:
// - Affinity +0.05 to +0.15 (based on compatibility)
// - Share resource location knowledge
// - Learn about other NPCs (gossip)
```

### 2. Trade (NPC-to-NPC)

**Purpose:** Direct exchange of goods between NPCs

```typescript
interface NPCTradeAction {
  type: 'npc_trade';
  targetNPC: string;
  offering: InventoryItem[];
  requesting: InventoryItem[];
}

// Trade acceptance based on:
// - Fairness of trade (value comparison)
// - Relationship affinity
// - Current needs
// - Personality (greedy NPCs demand more)
```

### 3. Cooperate

**Purpose:** Work together on complex tasks

```typescript
interface CooperateAction {
  type: 'cooperate';
  participants: string[];  // NPC IDs
  task: 'build' | 'gather' | 'hunt' | 'defend';
  coordinator: string;     // Leader NPC
}

// Benefits:
// - Tasks complete faster
// - Shared rewards
// - Affinity boost between participants
// - Skill learning from more experienced NPCs
```

### 4. Compete

**Purpose:** Contest for limited resources

```typescript
interface CompeteAction {
  type: 'compete';
  targetNPC: string;
  resource: string;
  strategy: 'aggressive' | 'fair' | 'deceptive';
}

// Outcomes:
// - Winner gets resource
// - Affinity change (negative for loser)
// - Reputation impact
```

### 5. Help

**Purpose:** Assist another NPC in need

```typescript
interface HelpAction {
  type: 'help';
  targetNPC: string;
  helpType: 'give_food' | 'give_money' | 'share_shelter' | 'defend';
}

// Effects:
// - Large affinity boost (+0.3)
// - Trust increase
// - Recipient may reciprocate later
```

## Social Utility

Social actions will have utility based on:

```python
def calculate_social_utility(action, npc_state, target_npc):
    utility = 0.0
    
    relationship = npc_state.memory.relationships.get(target_npc.id)
    affinity = relationship.affinity if relationship else 0.0
    
    # Sociability trait increases social action utility
    social_bonus = npc_state.personality['sociability'] * 0.5
    
    if action.type == 'chat':
        # More sociable NPCs love chatting
        utility += social_bonus
        
        # Prefer chatting with friends
        if affinity > 0.5:
            utility += 0.3
        elif affinity < -0.5:
            utility -= 0.5  # Avoid enemies
    
    elif action.type == 'cooperate':
        # Planful NPCs see value in cooperation
        if npc_state.personality['planfulness'] > 0.6:
            utility += 0.4
        
        # Only cooperate with trusted NPCs
        if relationship and relationship.trust > 0.6:
            utility += 0.3
        else:
            utility -= 0.2  # Risky with strangers
    
    elif action.type == 'help':
        # Altruistic NPCs (low greed) help more
        if npc_state.personality['greed'] < 0.4:
            utility += 0.5
        else:
            utility -= 0.2  # Greedy NPCs avoid helping
        
        # Help friends more
        utility += affinity * 0.4
    
    return utility
```

## Information Sharing

NPCs share knowledge through conversation:

```typescript
// During chat action
function shareInformation(npc1: NPC, npc2: NPC, world: WorldManager): void {
  const relationship = npc1.memory.relationships.get(npc2.id);
  
  // Only share with friends (affinity > 0.3)
  if (!relationship || relationship.affinity < 0.3) {
    return;
  }
  
  // Share resource locations
  npc1.memory.knownResources.forEach((memory, resourceType) => {
    memory.locations.forEach(loc => {
      if (loc.reliability > 0.7) {
        // Add to npc2's memory with reduced reliability
        world.memoryManager.remember(npc2, {
          type: 'resource_spotted',
          resourceType: resourceType,
          position: loc.position,
          tick: world.state.tick,
          reliability: loc.reliability * 0.7  // Secondhand knowledge less reliable
        });
      }
    });
  });
  
  // Share gossip about other NPCs
  npc1.memory.relationships.forEach((rel, npcId) => {
    if (Math.abs(rel.affinity) > 0.5) {
      // Share strong opinions
      console.log(`${npc1.name} tells ${npc2.name} about ${npcId} (affinity: ${rel.affinity})`);
    }
  });
}
```

## Emergent Social Structures

### Friend Groups

NPCs with mutual high affinity form groups:

```typescript
function detectFriendGroups(npcs: NPC[]): NPC[][] {
  const groups: NPC[][] = [];
  const visited = new Set<string>();
  
  npcs.forEach(npc => {
    if (visited.has(npc.id)) return;
    
    const group = [npc];
    visited.add(npc.id);
    
    // Find friends of friends
    const queue = [npc];
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      current.memory.relationships.forEach((rel, npcId) => {
        if (rel.affinity > 0.6 && !visited.has(npcId)) {
          const friend = npcs.find(n => n.id === npcId);
          if (friend) {
            group.push(friend);
            visited.add(npcId);
            queue.push(friend);
          }
        }
      });
    }
    
    if (group.length > 1) {
      groups.push(group);
    }
  });
  
  return groups;
}
```

### Leadership

NPCs with high planfulness and sociability become natural leaders:

```typescript
function selectGroupLeader(group: NPC[]): NPC {
  return group.reduce((leader, npc) => {
    const leaderScore = 
      leader.personality.traits.planfulness * 0.5 +
      leader.personality.traits.sociability * 0.3 +
      (leader.skills.crafting + leader.skills.trading) / 200;
    
    const npcScore = 
      npc.personality.traits.planfulness * 0.5 +
      npc.personality.traits.sociability * 0.3 +
      (npc.skills.crafting + npc.skills.trading) / 200;
    
    return npcScore > leaderScore ? npc : leader;
  });
}
```

## Implementation Timeline

### Phase 4.1: Basic Relationships (Week 4)
- [ ] Add relationship data structure to NPC memory
- [ ] Implement affinity calculation
- [ ] Add chat action
- [ ] Track interaction history

### Phase 4.2: NPC-to-NPC Trade (Week 5)
- [ ] Implement trade negotiation
- [ ] Add fairness evaluation
- [ ] Integrate with relationship system

### Phase 4.3: Cooperation (Week 5-6)
- [ ] Define cooperative tasks
- [ ] Implement task coordination
- [ ] Add reward sharing

### Phase 4.4: Advanced Social (Week 6)
- [ ] Information sharing during chat
- [ ] Friend group detection
- [ ] Leadership emergence
- [ ] Conflict resolution

## Testing Strategy

```typescript
describe('Social Dynamics', () => {
  it('builds affinity through positive interactions', async () => {
    const npc1 = createNPC({ sociability: 0.8 });
    const npc2 = createNPC({ sociability: 0.7 });
    
    // Simulate 10 chat interactions
    for (let i = 0; i < 10; i++) {
      await executeAction(npc1, 'chat', npc2.id);
    }
    
    const relationship = npc1.memory.relationships.get(npc2.id);
    expect(relationship.affinity).toBeGreaterThan(0.5);
  });
  
  it('forms friend groups', () => {
    // Create 5 NPCs with interconnected relationships
    const npcs = createConnectedNPCs(5);
    
    const groups = detectFriendGroups(npcs);
    
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].length).toBeGreaterThan(1);
  });
});
```

## Future Enhancements

1. **Factions:** Formal groups with shared goals
2. **Reputation System:** Global reputation affects all interactions
3. **Marriage/Family:** Long-term partnerships and inheritance
4. **Conflict Escalation:** Feuds and wars between groups
5. **Cultural Norms:** Shared behaviors within communities

## References

- [Social Simulation in Games](https://www.gamedeveloper.com/design/social-simulation-in-games)
- [The Sims Social System](https://www.gdcvault.com/play/1014632/The-Sims-Social)
- [Emergent Narrative](https://en.wikipedia.org/wiki/Emergent_narrative)
