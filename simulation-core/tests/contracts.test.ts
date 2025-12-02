import { WorldManager } from "../src/world";
import { Contract, NPC } from "../src/types";

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: { best_action: "idle", utility: 0 } })),
}));

describe("Contract System", () => {
  let world: WorldManager;
  let customer: NPC;
  let builder: NPC;

  beforeEach(() => {
    world = new WorldManager();
    // Setup Customer
    world.createNPC("customer", "Customer", { x: 0, y: 0 });
    customer = world.getState().npcs["customer"];
    customer.stats.money = 1000;

    // Setup Builder
    world.createNPC(
      "builder",
      "Builder",
      { x: 0, y: 0 },
      { gathering: 10, crafting: 100, trading: 10 }
    );
    builder = world.getState().npcs["builder"];
  });

  test("should execute full contract lifecycle", async () => {
    // 1. Create Contract
    customer.currentAction = "create_contract:house_small";
    await world.tick(); // Process action

    const contracts = Object.values(world.getState().contracts);
    expect(contracts.length).toBe(1);
    const contract = contracts[0];
    expect(contract.status).toBe("draft");
    expect(contract.customerId).toBe("customer");

    // 2. Sign Contract
    builder.currentAction = `sign_contract:${contract.id}`;
    await world.tick();
    expect(contract.status).toBe("signed");
    expect(contract.providerId).toBe("builder");

    // 3. Pay Prepayment
    customer.currentAction = `pay_prepayment:${contract.id}`;
    await world.tick();
    expect(contract.status).toBe("prepaid");
    expect(customer.stats.money).toBe(950); // 1000 - 50
    expect(builder.stats.money).toBe(50); // 0 + 50

    // 4. Build Step (Complete)
    builder.currentAction = `build_step:${contract.id}`;
    await world.tick();
    expect(contract.status).toBe("completed");

    // Check if building exists
    const buildings = Object.values(world.getState().buildings);
    const newHouse = buildings.find((b) => b.buildingType === "Small House");
    expect(newHouse).toBeDefined();

    // 5. Pay Final
    customer.currentAction = `pay_final:${contract.id}`;
    await world.tick();
    expect(contract.status).toBe("paid");
    expect(customer.stats.money).toBe(900); // 950 - 50
    expect(builder.stats.money).toBe(100); // 50 + 50
  });
});
