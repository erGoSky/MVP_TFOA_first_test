import { ActionHandler } from "../action-manager";
import { NPC, WorldState } from "../../types";
import { WorldManager } from "../../world";

export class ContractHandler implements ActionHandler {
  execute(npc: NPC, actionType: string, targetId: string, world: WorldManager): void {
    const state = world.getState();

    if (actionType === "create_contract") {
      const templateId = targetId; // e.g. 'house_small'
      const template = world.entityManager.BUILDING_TEMPLATES[templateId];

      if (template && npc.stats.money >= 100) {
        // Simple cost check
        const contractId = `contract_${Date.now()}_${npc.id}`;
        state.contracts[contractId] = {
          id: contractId,
          type: "construction",
          status: "draft",
          customerId: npc.id,
          templateId: template.id,
          requirements: template.components,
          totalCost: template.laborCost,
          prepayment: Math.floor(template.laborCost * 0.5),
          createdAt: Date.now(),
        };
        console.log(`${npc.name} created contract ${contractId} for ${template.name}.`);
      }
      world.resetAction(npc);
    } else if (actionType === "sign_contract") {
      const contract = state.contracts[targetId];
      if (contract && contract.status === "draft") {
        contract.providerId = npc.id;
        contract.status = "signed";
        console.log(`${npc.name} signed contract ${contract.id}.`);
      }
      world.resetAction(npc);
    } else if (actionType === "pay_prepayment") {
      const contract = state.contracts[targetId];
      if (contract && contract.customerId === npc.id && contract.status === "signed") {
        if (npc.stats.money >= contract.prepayment) {
          npc.stats.money -= contract.prepayment;
          const provider = state.npcs[contract.providerId!];
          if (provider) provider.stats.money += contract.prepayment;
          contract.status = "prepaid";
          console.log(`${npc.name} paid prepayment of ${contract.prepayment} for ${contract.id}.`);
        }
      }
      world.resetAction(npc);
    } else if (actionType === "build_step") {
      const contract = state.contracts[targetId];
      if (contract && contract.providerId === npc.id && contract.status === "prepaid") {
        // Check materials
        const missing: string[] = [];
        contract.requirements.forEach((req) => {
          const item = npc.inventory.find((i) => i.type === req.type);
          if (!item || item.quantity < req.count) {
            missing.push(`${req.type} (${item ? item.quantity : 0}/${req.count})`);
          }
        });

        if (missing.length > 0) {
          console.log(`${npc.name} cannot build ${contract.id}. Missing: ${missing.join(", ")}`);
          world.resetAction(npc);
          return;
        }

        // Consume materials
        contract.requirements.forEach((req) => {
          const item = npc.inventory.find((i) => i.type === req.type)!;
          item.quantity -= req.count;
          if (item.quantity <= 0) {
            npc.inventory = npc.inventory.filter((i) => i !== item);
          }
        });

        contract.status = "completed";

        // Create building
        const template = world.entityManager.BUILDING_TEMPLATES[contract.templateId!];
        const buildingId = `build_${Date.now()}`;
        world.createBuilding(buildingId, template.name, {
          x: npc.position.x + 2,
          y: npc.position.y + 2,
        });

        const building = state.buildings[buildingId];
        building.ownerId = contract.customerId;

        if (template.name.includes("House")) {
          const customer = state.npcs[contract.customerId];
          if (customer && customer.ownedBuildingIds.length === 0) {
            customer.ownedBuildingIds.push(buildingId);
            console.log(`${customer.name} is now the proud owner of ${buildingId}!`);
          }
        }

        console.log(`${npc.name} completed construction for ${contract.id}.`);
        npc.skills.crafting = Math.min(100, npc.skills.crafting + 5);
      }
      world.resetAction(npc);
    } else if (actionType === "pay_final") {
      const contract = state.contracts[targetId];
      if (contract && contract.customerId === npc.id && contract.status === "completed") {
        const remaining = contract.totalCost - contract.prepayment;
        if (npc.stats.money >= remaining) {
          npc.stats.money -= remaining;
          const provider = state.npcs[contract.providerId!];
          if (provider) provider.stats.money += remaining;
          contract.status = "paid";
          console.log(`${npc.name} paid final ${remaining} for ${contract.id}.`);
        }
      }
      world.resetAction(npc);
    }
  }
}
