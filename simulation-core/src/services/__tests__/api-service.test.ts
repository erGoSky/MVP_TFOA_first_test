import { APIService } from "../api-service";
import { createTestNPC } from "../../__tests__/fixtures";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("APIService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("requestPlan", () => {
    it("should return plan on successful request", async () => {
      const npc = createTestNPC();
      const goal = { id: "goal1", type: "OBTAIN_ITEM", priority: 10 };
      const worldState = { time: 0, resources: [], buildings: [] };
      const mockPlan = ["move_to_tree", "chop_wood"];

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          plan: mockPlan,
        },
      });

      const result = await APIService.requestPlan(npc, goal, worldState);

      expect(result).toEqual(mockPlan);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/plan_action_enhanced"),
        expect.objectContaining({
          npc_state: expect.objectContaining({
            id: npc.id,
            name: npc.name,
          }),
          goal: goal,
          world_state: worldState,
        })
      );
    });

    it("should return null on failed request", async () => {
      const npc = createTestNPC();
      const goal = { id: "goal1", type: "OBTAIN_ITEM", priority: 10 };
      const worldState = { time: 0, resources: [], buildings: [] };

      mockedAxios.post.mockResolvedValue({
        data: {
          success: false,
        },
      });

      const result = await APIService.requestPlan(npc, goal, worldState);

      expect(result).toBeNull();
    });

    it("should return null on network error", async () => {
      const npc = createTestNPC();
      const goal = { id: "goal1", type: "OBTAIN_ITEM", priority: 10 };
      const worldState = { time: 0, resources: [], buildings: [] };

      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      const result = await APIService.requestPlan(npc, goal, worldState);

      expect(result).toBeNull();
    });
  });

  describe("calculateUtility", () => {
    it("should return utility data on successful request", async () => {
      const npc = createTestNPC();
      const options = [{ action: "chop", utility: 0.8 }];
      const mockResponse = { bestAction: "chop", utility: 0.8 };

      mockedAxios.post.mockResolvedValue({
        data: mockResponse,
      });

      const result = await APIService.calculateUtility(npc, options);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/calculate_utility"),
        expect.objectContaining({
          npc: expect.objectContaining({
            id: npc.id,
            name: npc.name,
          }),
          options: options,
        })
      );
    });

    it("should return null on error", async () => {
      const npc = createTestNPC();
      const options = [{ action: "chop", utility: 0.8 }];

      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      const result = await APIService.calculateUtility(npc, options);

      expect(result).toBeNull();
    });
  });
});
