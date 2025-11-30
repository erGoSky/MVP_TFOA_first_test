# Personality System Documentation

## Overview

The Personality System gives each NPC unique behavioral characteristics through a set of traits that influence decision-making, creating diverse and memorable characters.

## Design Philosophy

**60% Human-like, 40% Optimal**
- NPCs make personality-driven decisions that may not always be optimal
- Adds unpredictability and realism to behavior
- Creates emergent storytelling opportunities

## Core Concepts

### Personality Traits

Each NPC has 6 core traits, each ranging from 0.0 to 1.0:

| Trait | Low (0.0-0.3) | Medium (0.4-0.6) | High (0.7-1.0) |
|-------|---------------|------------------|----------------|
| **Greed** | Altruistic, shares resources | Balanced trader | Hoards wealth, exploits opportunities |
| **Laziness** | Workaholic | Normal work ethic | Avoids work, seeks shortcuts |
| **Sociability** | Hermit, avoids others | Occasional interaction | Social butterfly, seeks company |
| **Risk Tolerance** | Cautious, safe choices | Calculated risks | Gambler, high-risk actions |
| **Planfulness** | Reactive, short-term | Some planning | Strategic, long-term goals |
| **Curiosity** | Routine-focused | Occasional exploration | Explorer, seeks novelty |

### Personality Archetypes

Pre-defined templates for common NPC types:

#### Merchant
```typescript
{
  greed: 0.8,           // Profit-driven
  laziness: 0.3,        // Hardworking
  sociability: 0.7,     // Enjoys trading
  riskTolerance: 0.6,   // Calculated risks
  planfulness: 0.7,     // Plans inventory
  curiosity: 0.4        // Focuses on trade
}
```

#### Hermit
```typescript
{
  greed: 0.2,           // Self-sufficient
  laziness: 0.4,        // Works when needed
  sociability: 0.1,     // Avoids people
  riskTolerance: 0.3,   // Very cautious
  planfulness: 0.6,     // Plans for isolation
  curiosity: 0.5        // Explores alone
}
```

#### Builder
```typescript
{
  greed: 0.5,           // Fair pricing
  laziness: 0.2,        // Dedicated worker
  sociability: 0.5,     // Professional
  riskTolerance: 0.4,   // Careful with projects
  planfulness: 0.9,     // Highly organized
  curiosity: 0.3        // Focused on craft
}
```

#### Adventurer
```typescript
{
  greed: 0.4,           // Seeks treasure
  laziness: 0.3,        // Active lifestyle
  sociability: 0.6,     // Shares stories
  riskTolerance: 0.8,   // Thrill-seeker
  planfulness: 0.4,     // Spontaneous
  curiosity: 0.9        // Explores everything
}
```

## Implementation

### Data Structures

```typescript
// types.ts
interface PersonalityTraits {
  greed: number;
  laziness: number;
  sociability: number;
  riskTolerance: number;
  planfulness: number;
  curiosity: number;
}

interface Personality {
  traits: PersonalityTraits;
  archetype: string;
  
  // Calculated utility weights
  getUtilityWeights(context: NPCContext): UtilityWeights;
}

interface NPC extends Entity {
  // ... other fields
  personality: Personality;
}
```

### Generation

```typescript
// personality/generator.ts
export class PersonalityGenerator {
  /**
   * Generate a personality from an archetype with variation
   */
  static generate(archetype?: string): Personality {
    if (archetype && PERSONALITY_ARCHETYPES[archetype]) {
      return this.generateFromArchetype(archetype);
    }
    return this.generateRandom();
  }
  
  private static generateFromArchetype(archetype: string): Personality {
    const template = PERSONALITY_ARCHETYPES[archetype];
    const traits: PersonalityTraits = {};
    
    // Add ±10% variation to each trait
    for (const [key, value] of Object.entries(template)) {
      const variation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
      traits[key] = Math.max(0, Math.min(1, value + variation));
    }
    
    return {
      traits,
      archetype,
      getUtilityWeights: (context) => this.calculateWeights(traits, context)
    };
  }
  
  private static generateRandom(): Personality {
    // Generate balanced random personality
    const traits: PersonalityTraits = {
      greed: Math.random(),
      laziness: Math.random(),
      sociability: Math.random(),
      riskTolerance: Math.random(),
      planfulness: Math.random(),
      curiosity: Math.random()
    };
    
    return {
      traits,
      archetype: 'random',
      getUtilityWeights: (context) => this.calculateWeights(traits, context)
    };
  }
}
```

### Utility Weight Calculation

```typescript
// personality/generator.ts
private static calculateWeights(
  traits: PersonalityTraits, 
  context: NPCContext
): UtilityWeights {
  // Base weights
  let needs = 0.5;
  let economic = 0.3;
  let social = 0.2;
  
  // Personality modifiers
  economic += traits.greed * 0.3;          // Greedy NPCs focus on money
  needs -= traits.greed * 0.2;             // At expense of needs
  
  social += traits.sociability * 0.3;      // Social NPCs seek interaction
  needs -= traits.sociability * 0.1;
  
  economic -= traits.laziness * 0.2;       // Lazy NPCs avoid work
  needs += traits.laziness * 0.1;          // Prefer rest
  
  // Context overrides (survival trumps personality)
  if (context.state === NPCContextState.DESPERATE) {
    needs = 0.9;
    economic = 0.1;
    social = 0.0;
  }
  
  // Normalize to sum to 1.0
  const total = needs + economic + social;
  return {
    needs: needs / total,
    economic: economic / total,
    social: social / total
  };
}
```

## Behavioral Effects

### Action Modifiers

Personality traits modify action utilities in the AI service:

```python
# ai-service/main.py
def apply_personality_modifiers(action, npc_state):
    utility = calculate_base_utility(action, npc_state)
    traits = npc_state.personality
    
    # Work actions
    if action.type == 'work':
        if traits['laziness'] > 0.7:
            utility *= 0.5  # Lazy NPCs avoid work
        if traits['greed'] > 0.7:
            utility *= 1.3  # Greedy NPCs love earning money
    
    # Exploration
    if action.type == 'explore':
        if traits['curiosity'] > 0.6:
            utility *= 1.5  # Curious NPCs explore more
        if traits['riskTolerance'] < 0.3:
            utility *= 0.7  # Cautious NPCs avoid unknown
    
    # Social actions
    if action.type in ['chat', 'trade', 'cooperate']:
        if traits['sociability'] > 0.6:
            utility *= 1.4  # Social NPCs seek interaction
        if traits['sociability'] < 0.3:
            utility *= 0.5  # Hermits avoid people
    
    # Risky actions
    if action.params.get('risk_level', 0) > 0.5:
        if traits['riskTolerance'] > 0.7:
            utility *= 1.2  # Risk-takers embrace danger
        if traits['riskTolerance'] < 0.3:
            utility *= 0.6  # Cautious NPCs avoid risk
    
    return utility
```

### Goal Selection

Planful NPCs pursue long-term goals more often:

```typescript
// goals/goal-manager.ts
selectGoal(npc: NPC, world: WorldManager): Goal | null {
  // Only planful NPCs set long-term goals
  if (npc.personality.traits.planfulness < 0.5) {
    return null; // Reactive, no long-term planning
  }
  
  // Goal selection based on personality
  if (npc.personality.traits.greed > 0.7) {
    return this.createGoal(GoalType.ACCUMULATE_WEALTH, npc);
  }
  
  if (npc.personality.traits.curiosity > 0.7) {
    return this.createGoal(GoalType.EXPLORE_WORLD, npc);
  }
  
  if (npc.personality.traits.sociability > 0.7) {
    return this.createGoal(GoalType.BUILD_RELATIONSHIP, npc);
  }
  
  // Default: own a house
  if (!npc.ownedBuildingIds.length) {
    return this.createGoal(GoalType.OWN_HOUSE, npc);
  }
  
  return null;
}
```

## Examples

### Example 1: Greedy Merchant

**Traits:** Greed=0.9, Laziness=0.2, Sociability=0.7

**Behavior:**
- Constantly seeks trading opportunities
- Hoards valuable items
- Rarely gives discounts
- Works long hours to accumulate wealth
- Friendly to customers but profit-focused

### Example 2: Lazy Hermit

**Traits:** Greed=0.1, Laziness=0.8, Sociability=0.2

**Behavior:**
- Avoids work unless necessary
- Prefers sleeping and resting
- Gathers only enough food to survive
- Stays away from towns and people
- Lives in remote locations

### Example 3: Curious Adventurer

**Traits:** Curiosity=0.9, RiskTolerance=0.8, Planfulness=0.3

**Behavior:**
- Explores every corner of the map
- Takes dangerous shortcuts
- Tries new actions frequently
- Doesn't plan ahead much
- Often gets into trouble but learns from it

## Tuning Guide

### Increasing Personality Impact
```typescript
// Increase modifier strength
if (traits.greed > 0.7) {
  utility *= 2.0; // Was 1.3, now stronger
}
```

### Balancing Archetypes
1. Playtest each archetype for 100 ticks
2. Measure survival rate and goal completion
3. Adjust traits if archetype is too weak/strong
4. Aim for 70-90% survival rate

### Creating New Archetypes
```typescript
// personality/archetypes.ts
export const PERSONALITY_ARCHETYPES = {
  // ... existing archetypes
  
  scholar: {
    greed: 0.3,
    laziness: 0.5,
    sociability: 0.4,
    riskTolerance: 0.2,
    planfulness: 0.8,
    curiosity: 0.9
  }
};
```

## Testing

### Unit Tests
```typescript
describe('PersonalityGenerator', () => {
  it('generates personalities within valid range', () => {
    const personality = PersonalityGenerator.generate();
    Object.values(personality.traits).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
  
  it('applies archetype variation correctly', () => {
    const merchant1 = PersonalityGenerator.generate('merchant');
    const merchant2 = PersonalityGenerator.generate('merchant');
    
    // Should be similar but not identical
    expect(merchant1.traits.greed).toBeCloseTo(0.8, 1);
    expect(merchant1.traits.greed).not.toBe(merchant2.traits.greed);
  });
});
```

### Behavioral Tests
```typescript
describe('Personality Behavior', () => {
  it('greedy NPCs accumulate more wealth', async () => {
    const greedy = createNPC({ greed: 0.9 });
    const normal = createNPC({ greed: 0.5 });
    
    await simulateTicks(100);
    
    expect(greedy.stats.money).toBeGreaterThan(normal.stats.money);
  });
  
  it('lazy NPCs work less frequently', async () => {
    const lazy = createNPC({ laziness: 0.9 });
    const workaholic = createNPC({ laziness: 0.1 });
    
    const lazyWorkCount = countActions(lazy, 'work');
    const workaholicWorkCount = countActions(workaholic, 'work');
    
    expect(lazyWorkCount).toBeLessThan(workaholicWorkCount * 0.5);
  });
});
```

## Performance

- **Memory:** ~100 bytes per NPC (6 floats + archetype string)
- **CPU:** Negligible (simple arithmetic)
- **Serialization:** Included in NPC save data

## Future Enhancements

1. **Dynamic Traits:** Traits change based on experiences
2. **Trait Conflicts:** Internal struggles (greedy but altruistic)
3. **Mood System:** Temporary personality shifts
4. **Cultural Traits:** Shared traits for NPC groups
5. **Genetic Inheritance:** Child NPCs inherit parent traits

## References

- [The Sims Personality System](https://www.gamedeveloper.com/design/postmortem-maxis-i-the-sims-i-)
- [Big Five Personality Traits](https://en.wikipedia.org/wiki/Big_Five_personality_traits)
- [AI Personality in Games](https://www.gdcvault.com/play/1020386/AI-driven-Dynamic-Dialog-through)
