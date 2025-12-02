import axios from "axios";
import { NPC } from "../types";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class APIService {
  public static async requestPlan(npc: NPC, goal: any, worldState: any): Promise<string[] | null> {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/plan_action_enhanced`, {
        npc_state: {
          id: npc.id,
          name: npc.name,
          position: npc.position,
          inventory: npc.inventory,
          skills: npc.skills,
          stats: npc.stats,
          personality: npc.personality,
        },
        goal: goal,
        world_state: worldState,
      });

      if (response.data && response.data.success) {
        return response.data.plan;
      }
      return null;
    } catch (error) {
      console.error(`Error requesting plan for ${npc.name}:`, error);
      return null;
    }
  }

  public static async calculateUtility(npc: NPC, options: any[]): Promise<any> {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/calculate_utility`, {
        npc: {
          id: npc.id,
          name: npc.name,
          needs: npc.needs,
          stats: npc.stats,
          skills: npc.skills,
          currentAction: npc.currentAction,
          inventory: npc.inventory,
          homeId: npc.ownedBuildingIds.length > 0 ? npc.ownedBuildingIds[0] : null,
        },
        options: options,
      });
      return response.data;
    } catch (error) {
      console.error(`Error calculating utility for ${npc.name}:`, error);
      return null;
    }
  }
}
