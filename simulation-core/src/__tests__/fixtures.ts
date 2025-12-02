import { NPC, Resource, Building } from "../types";

/**
 * Create a test NPC with default or custom values
 */
export function createTestNPC(overrides?: Partial<NPC>): NPC {
  const defaults: NPC = {
    id: "test-npc-1",
    type: "npc",
    name: "Test NPC",
    position: { x: 50, y: 50 },
    needs: { hunger: 0.5, energy: 0.8, social: 0.5 },
    stats: { health: 100, money: 100, speed: 1 },
    skills: { gathering: 10, crafting: 10, trading: 10 },
    personality: {
      archetype: "balanced",
      traits: {
        greed: 0.5,
        laziness: 0.5,
        sociability: 0.5,
        riskTolerance: 0.5,
        planfulness: 0.5,
        curiosity: 0.5,
      },
    },
    currentAction: null,
    actionState: { inProgress: false, startTime: 0, duration: 0 },
    inventory: [],
    hands: null,
    ownedBuildingIds: [],
    memory: {
      locations: new Map(),
      lastSeen: new Map(),
    },
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a test resource
 */
export function createTestResource(type: string = "tree", overrides?: Partial<Resource>): Resource {
  const defaults: Resource = {
    id: `test-resource-${type}`,
    type: "resource",
    resourceType: type as any, // Type assertion for test flexibility
    position: { x: 60, y: 60 },
    amount: 10,
    harvested: false,
    properties: { value: 1 },
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a test building
 */
export function createTestBuilding(
  type: string = "house_small",
  overrides?: Partial<Building>
): Building {
  const defaults: Building = {
    id: `test-building-${type}`,
    type: "building",
    buildingType: type,
    position: { x: 70, y: 70 },
    inventory: [],
    gold: 0,
  };

  return { ...defaults, ...overrides };
}
