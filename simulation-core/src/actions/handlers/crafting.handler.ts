import { ActionHandler } from "../action-manager";
import { NPC, Building, Vector2 } from "../../types";
import { WorldManager } from "../../world";
import { RECIPES, getRecipe, type Recipe } from "../../constants/recipes";
import type { WorkstationType } from "../../constants/entities";
import { ITEM_DURABILITY } from "../../constants/items";

export class CraftingHandler implements ActionHandler {
  execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
    const state = world.getState();

    if (actionType === "eat") {
      const item = npc.inventory.find((i) => i.type === targetId);
      if (item) {
        npc.needs.hunger = Math.max(0, npc.needs.hunger - 0.3);
        npc.needs.energy = Math.min(1, npc.needs.energy + 0.1);

        // Consume item
        item.quantity -= 1;
        if (item.quantity <= 0) {
          npc.inventory = npc.inventory.filter((i) => i !== item);
        }
        console.log(`${npc.name} ate ${targetId}.`);
      }
      world.resetAction(npc);
    } else if (actionType === "craft") {
      this.handleCrafting(npc, targetId, world);
    }
  }

  private handleCrafting(npc: NPC, recipeId: string, world: WorldManager): void {
    const recipe = getRecipe(recipeId);

    if (!recipe) {
      console.log(`${npc.name} failed to craft: Recipe '${recipeId}' not found`);
      world.resetAction(npc);
      return;
    }

    // Check workstation requirement
    if (recipe.requiredWorkstation) {
      const nearbyWorkstation = this.findNearbyWorkstation(
        npc.position,
        recipe.requiredWorkstation,
        world
      );

      if (!nearbyWorkstation) {
        console.log(`${npc.name} needs ${recipe.requiredWorkstation} to craft ${recipe.name}`);
        world.resetAction(npc);
        return;
      }
    }

    // Check skill requirement
    if (recipe.skillRequired) {
      const npcSkill = (npc.skills as any)[recipe.skillRequired.skill] || 0;
      if (npcSkill < recipe.skillRequired.level) {
        console.log(
          `${npc.name} lacks ${recipe.skillRequired.skill} skill (${npcSkill}/${recipe.skillRequired.level}) to craft ${recipe.name}`
        );
        world.resetAction(npc);
        return;
      }
    }

    // Check if NPC has required materials
    const hasAllMaterials = recipe.inputs.every((input) => {
      const item = npc.inventory.find((i) => i.type === input.type);
      return item && item.quantity >= input.quantity;
    });

    if (!hasAllMaterials) {
      console.log(`${npc.name} lacks materials to craft ${recipe.name}`);
      world.resetAction(npc);
      return;
    }

    // Consume materials
    recipe.inputs.forEach((input) => {
      const item = npc.inventory.find((i) => i.type === input.type);
      if (item) {
        item.quantity -= input.quantity;
        if (item.quantity <= 0) {
          npc.inventory = npc.inventory.filter((i) => i !== item);
        }
      }
    });

    // Add crafted item to inventory
    // Add crafted item to inventory
    const maxDurability = ITEM_DURABILITY[recipe.output.type];

    if (maxDurability) {
      // Durable items (tools) do not stack
      npc.inventory.push({
        id: `${recipe.output.type}_${Date.now()}`,
        type: recipe.output.type,
        quantity: recipe.output.quantity,
        properties: {
          durability: maxDurability,
          maxDurability: maxDurability,
        },
      });
    } else {
      // Stackable items
      const existingOutput = npc.inventory.find((i) => i.type === recipe.output.type);
      if (existingOutput) {
        existingOutput.quantity += recipe.output.quantity;
      } else {
        npc.inventory.push({
          id: `${recipe.output.type}_${Date.now()}`,
          type: recipe.output.type,
          quantity: recipe.output.quantity,
        });
      }
    }

    console.log(`${npc.name} crafted ${recipe.output.quantity}x ${recipe.name}`);

    // Increase crafting skill
    const skillGain = recipe.skillRequired ? 3 : 2;
    npc.skills.crafting = Math.min(100, npc.skills.crafting + skillGain);

    world.resetAction(npc);
  }

  private findNearbyWorkstation(
    position: Vector2,
    workstationType: WorkstationType,
    world: WorldManager
  ): Building | null {
    const buildings = Object.values(world.getState().buildings);
    return (
      buildings.find(
        (b) => b.buildingType === workstationType && world.getDistance(position, b.position) <= 2
      ) || null
    );
  }
}
