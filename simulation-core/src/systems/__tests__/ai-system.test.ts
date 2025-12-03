import { AISystem } from "../ai-system";
import { createTestNPC } from "../../__tests__/fixtures";
import { WorldManager } from "../../world";
import { APIService } from "../../services/api-service";

// Mock APIService
jest.mock("../../services/api-service");

describe("AISystem", () => {
  let aiSystem: AISystem;
  let mockWorld: jest.Mocked<WorldManager>;
  let mockAPIService: jest.Mocked<typeof APIService>;

  beforeEach(() => {
    aiSystem = new AISystem();

    // Create mock WorldManager
    mockWorld = {
      entityManager: {
        getAllEntities: jest.fn().mockReturnValue([]),
        getEntitiesInRange: jest.fn().mockReturnValue([]),
      },
      actionManager: {
        executeAction: jest.fn(),
      },
      getState: jest.fn().mockReturnValue({
        tick: 0,
        time: 0,
        width: 100,
        height: 100,
        tiles: [],
        entities: {},
        npcs: {},
        resources: {},
        buildings: {},
        contracts: {},
      }),
    } as any;

    // Mock APIService
    mockAPIService = APIService as jest.Mocked<typeof APIService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("update", () => {
    it("should update NPC memory on tick", async () => {
      const npc = createTestNPC();
      await aiSystem.update(npc, mockWorld, 1);

      expect(mockWorld.entityManager.getAllEntities).toHaveBeenCalled();
    });

    it("should execute completed actions", async () => {
      const npc = createTestNPC({
        currentAction: "chop",
        actionState: {
          inProgress: true,
          startTime: 0,
          duration: 5,
        },
      });

      await aiSystem.update(npc, mockWorld, 10);

      expect(mockWorld.actionManager.executeAction).toHaveBeenCalledWith(npc, "chop", mockWorld);
    });

    it("should not execute actions that are not complete", async () => {
      const npc = createTestNPC({
        currentAction: "chop",
        actionState: {
          inProgress: true,
          startTime: 0,
          duration: 20,
        },
      });

      await aiSystem.update(npc, mockWorld, 10);

      expect(mockWorld.actionManager.executeAction).not.toHaveBeenCalled();
    });

    it("should set idle when no goals", async () => {
      const npc = createTestNPC();
      npc.lastPlanRequestTick = -1000; // Ensure no throttling
      mockAPIService.requestPlan = jest.fn().mockResolvedValue(null);

      await aiSystem.update(npc, mockWorld, 1);

      expect(npc.currentAction).toBe("idle");
      expect(npc.actionState.inProgress).toBe(true);
    });

    it("should request plan from API when goal exists", async () => {
      const npc = createTestNPC();
      npc.lastPlanRequestTick = -1000; // Ensure no throttling
      const mockPlan = ["move_to_tree", "chop_wood"];

      mockAPIService.requestPlan = jest.fn().mockResolvedValue(mockPlan);

      // Add a goal manually
      aiSystem.addGoal(npc.id, {
        id: "goal1",
        type: "OBTAIN_ITEM",
        priority: 10,
        targetItem: "wood",
      });

      await aiSystem.update(npc, mockWorld, 1);

      expect(mockAPIService.requestPlan).toHaveBeenCalled();
    });

    it("should abandon goal when planning fails", async () => {
      const npc = createTestNPC();
      npc.lastPlanRequestTick = -1000; // Ensure no throttling
      mockAPIService.requestPlan = jest.fn().mockResolvedValue(null);

      aiSystem.addGoal(npc.id, {
        id: "goal2",
        type: "OBTAIN_ITEM",
        priority: 10,
        targetItem: "wood",
      });

      await aiSystem.update(npc, mockWorld, 1);

      expect(npc.currentAction).toBe("idle");
    });
  });

  describe("addGoal", () => {
    it("should add goal to goal manager", () => {
      const goal = {
        id: "goal3",
        type: "MAINTAIN_NEED",
        priority: 15,
        need: "hunger",
      };

      expect(() => aiSystem.addGoal("npc1", goal)).not.toThrow();
    });
  });
});
