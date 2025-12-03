import { MemorySystem } from "../memory.system";
import { createTestNPC } from "../../__tests__/fixtures";
import { Entity } from "../../types";

describe("MemorySystem", () => {
  let memorySystem: MemorySystem;
  let npc: any;

  beforeEach(() => {
    memorySystem = new MemorySystem();
    npc = createTestNPC();
    npc.skills = { memory: 1 }; // Base skill
  });

  const createEntity = (id: string, type: "resource" | "building", subtype: string): Entity =>
    ({
      id,
      type,
      position: { x: 10, y: 10 },
      ...(type === "resource" ? { resourceType: subtype } : { buildingType: subtype }),
    }) as any;

  describe("updateMemory", () => {
    it("should initialize memory on first encounter", () => {
      const entity = createEntity("tree1", "resource", "tree_oak");
      memorySystem.updateMemory(npc, [entity], 1);

      const memory = npc.memory.locations.get("tree1");
      expect(memory).toBeDefined();
      expect(memory.interactionCount).toBe(1);
      expect(memory.retentionDuration).toBe(1); // Base 1 tick
      expect(memory.expiryTick).toBe(2); // 1 + 1
      expect(memory.forgotten).toBe(false);
    });

    it("should increment interaction count only on new session", () => {
      const entity = createEntity("tree1", "resource", "tree_oak");

      // Tick 1: First encounter (New Session)
      memorySystem.updateMemory(npc, [entity], 1);
      expect(npc.memory.locations.get("tree1").interactionCount).toBe(1);

      // Tick 2: Still visible (Same Session)
      memorySystem.updateMemory(npc, [entity], 2);
      expect(npc.memory.locations.get("tree1").interactionCount).toBe(1);

      // Tick 3: Not visible (End Session)
      memorySystem.updateMemory(npc, [], 3);

      // Tick 4: Visible again (New Session)
      memorySystem.updateMemory(npc, [entity], 4);
      expect(npc.memory.locations.get("tree1").interactionCount).toBe(2);
    });

    it("should apply retention multiplier on re-encounter", () => {
      const entity = createEntity("tree1", "resource", "tree_oak");
      npc.skills.memory = 5; // High skill -> multiplier = 1 + (0.2 * 5) = 2.0

      // First encounter: duration = 1
      memorySystem.updateMemory(npc, [entity], 1);
      let memory = npc.memory.locations.get("tree1");
      expect(memory.retentionDuration).toBe(1);

      // End session
      memorySystem.updateMemory(npc, [], 2);

      // Re-encounter: duration = 1 * 2.0 = 2
      memorySystem.updateMemory(npc, [entity], 3);
      memory = npc.memory.locations.get("tree1");
      expect(memory.retentionDuration).toBe(2);

      // End session
      memorySystem.updateMemory(npc, [], 4);

      // Re-encounter: duration = 2 * 2.0 = 4
      memorySystem.updateMemory(npc, [entity], 5);
      memory = npc.memory.locations.get("tree1");
      expect(memory.retentionDuration).toBe(4);
    });

    it("should mark memory as forgotten when expired", () => {
      const entity = createEntity("tree1", "resource", "tree_oak");

      // Tick 1: Seen. Expiry = 1 + 1 = 2
      memorySystem.updateMemory(npc, [entity], 1);

      // Tick 2: Not seen. Current (2) is not > Expiry (2). Still remembered.
      memorySystem.updateMemory(npc, [], 2);
      expect(npc.memory.locations.get("tree1").forgotten).toBe(false);

      // Tick 3: Not seen. Current (3) > Expiry (2). Forgotten.
      memorySystem.updateMemory(npc, [], 3);
      expect(npc.memory.locations.get("tree1").forgotten).toBe(true);
    });

    it("should un-forget memory when seen again", () => {
      const entity = createEntity("tree1", "resource", "tree_oak");

      // Tick 1: Seen
      memorySystem.updateMemory(npc, [entity], 1);

      // Tick 10: Long time passed, definitely forgotten
      memorySystem.updateMemory(npc, [], 10);
      expect(npc.memory.locations.get("tree1").forgotten).toBe(true);

      // Tick 11: Seen again
      memorySystem.updateMemory(npc, [entity], 11);
      expect(npc.memory.locations.get("tree1").forgotten).toBe(false);
    });
  });

  describe("getValidMemories", () => {
    it("should return only non-forgotten memories", () => {
      const entity1 = createEntity("tree1", "resource", "tree_oak");
      const entity2 = createEntity("rock1", "resource", "rock_stone");

      // Both seen at tick 1
      memorySystem.updateMemory(npc, [entity1, entity2], 1);

      // Force entity1 to be forgotten
      npc.memory.locations.get("tree1").forgotten = true;

      const valid = memorySystem.getValidMemories(npc);
      expect(valid.length).toBe(1);
      expect(valid[0].id).toBe("rock1");
    });
  });
});
