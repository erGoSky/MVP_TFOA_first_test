import { WorldManager } from "./world";

export function initializeTestWorld(world: WorldManager) {
  // Create 5 diverse NPCs with matching personality archetypes
  // 1. Expert Gatherer - Farmer personality
  world.createNPC(
    "npc_gatherer",
    "Gatherer",
    { x: 10, y: 10 },
    { gathering: 80, crafting: 10, trading: 10 },
    "farmer"
  );

  // 2. Expert Crafter - Artisan personality
  world.createNPC(
    "npc_crafter",
    "Crafter",
    { x: 20, y: 20 },
    { gathering: 20, crafting: 80, trading: 20 },
    "artisan"
  );

  // 3. Expert Trader - Merchant personality
  world.createNPC(
    "npc_trader",
    "Trader",
    { x: 25, y: 28 },
    { gathering: 10, crafting: 10, trading: 80 },
    "merchant"
  );

  // 4. Novice - Random personality
  world.createNPC(
    "npc_novice",
    "Novice",
    { x: 15, y: 15 },
    { gathering: 5, crafting: 5, trading: 5 }
  );

  // 5. Veteran - Adventurer personality
  world.createNPC(
    "npc_veteran",
    "Veteran",
    { x: 18, y: 18 },
    { gathering: 60, crafting: 60, trading: 60 },
    "adventurer"
  );

  // Create diverse resources
  const resources = [
    {
      id: "res_berry_1",
      type: "bush_berry",
      pos: { x: 5, y: 5 },
      amt: 5,
      props: { edible: true, nutrition: 0.2, value: 2 },
    },
    {
      id: "res_berry_2",
      type: "bush_berry",
      pos: { x: 8, y: 12 },
      amt: 5,
      props: { edible: true, nutrition: 0.2, value: 2 },
    },
    { id: "res_flower_1", type: "flower_honey", pos: { x: 12, y: 8 }, amt: 3, props: { value: 5 } },
    {
      id: "res_fiber_1",
      type: "plant_fiber",
      pos: { x: 15, y: 20 },
      amt: 10,
      props: { craftingMaterial: true, value: 1 },
    },
    {
      id: "res_mush_1",
      type: "mushroom_red",
      pos: { x: 25, y: 5 },
      amt: 2,
      props: { edible: true, nutrition: 0.1, value: 3 },
    }, // Maybe poisonous?
    {
      id: "res_mush_2",
      type: "mushroom_brown",
      pos: { x: 26, y: 6 },
      amt: 3,
      props: { edible: true, nutrition: 0.15, value: 3 },
    },
    { id: "res_herb_1", type: "herb_healing", pos: { x: 30, y: 10 }, amt: 2, props: { value: 10 } },
    {
      id: "res_tree_oak_1",
      type: "oak_tree",
      pos: { x: 10, y: 30 },
      amt: 20,
      props: { craftingMaterial: true, value: 5 },
    },
    {
      id: "res_tree_pine_1",
      type: "pine_tree",
      pos: { x: 5, y: 35 },
      amt: 20,
      props: { craftingMaterial: true, value: 5 },
    },
    {
      id: "res_tree_apple_1",
      type: "apple_tree",
      pos: { x: 15, y: 35 },
      amt: 10,
      props: { edible: true, nutrition: 0.3, value: 4 },
    },
    {
      id: "res_rock_1",
      type: "stone",
      pos: { x: 40, y: 40 },
      amt: 10,
      props: { craftingMaterial: true, value: 1 },
    },
    {
      id: "res_ore_iron_1",
      type: "ore_iron",
      pos: { x: 45, y: 45 },
      amt: 5,
      props: { craftingMaterial: true, value: 15 },
    },
    {
      id: "res_ore_coal_1",
      type: "ore_coal",
      pos: { x: 42, y: 48 },
      amt: 8,
      props: { craftingMaterial: true, value: 8 },
    },
    {
      id: "res_ore_gold_1",
      type: "ore_gold",
      pos: { x: 48, y: 42 },
      amt: 2,
      props: { craftingMaterial: true, value: 50 },
    },
    {
      id: "res_clay_1",
      type: "clay_patch",
      pos: { x: 20, y: 45 },
      amt: 10,
      props: { craftingMaterial: true, value: 2 },
    },
    {
      id: "res_log_1",
      type: "fallen_log",
      pos: { x: 18, y: 28 },
      amt: 3,
      props: { craftingMaterial: true, value: 2 },
    },
    {
      id: "res_stones_1",
      type: "loose_stones",
      pos: { x: 22, y: 32 },
      amt: 5,
      props: { craftingMaterial: true, value: 1 },
    },
    {
      id: "res_wheat_1",
      type: "wild_wheat",
      pos: { x: 35, y: 25 },
      amt: 10,
      props: { edible: true, nutrition: 0.1, value: 2 },
    },
    {
      id: "res_water_1",
      type: "water_source",
      pos: { x: 30, y: 30 },
      amt: 100,
      props: { edible: true, nutrition: 0.05, value: 0 },
    },
    {
      id: "res_crystal_1",
      type: "crystal_blue",
      pos: { x: 50, y: 5 },
      amt: 1,
      props: { value: 100 },
    },
  ];

  resources.forEach((r) => world.createResource(r.id, r.type, r.pos, r.amt, r.props));

  // Create Tavern
  world.createBuilding("b_tavern", "tavern", { x: 25, y: 25 });

  console.log(`Test World initialized with NPCs, Tavern, and ${resources.length} Resource types`);
}
