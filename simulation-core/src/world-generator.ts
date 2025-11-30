import { WorldManager } from './world';
import { Vector2 } from './types';

export interface GenerationParams {
  mapSize?: number;
  npcCount?: number;
  resourceDensity?: number; // 0-1
  seed?: number;
}

export class WorldGenerator {
  private world: WorldManager;

  constructor(world: WorldManager) {
    this.world = world;
  }

  public generate(params: GenerationParams = {}) {
    this.world.reset();
    
    // Default params
    const mapSize = params.mapSize || 100;
    const npcCount = params.npcCount || 5;
    const resourceDensity = params.resourceDensity || 0.5;

    console.log(`Generating world with size ${mapSize}, ${npcCount} NPCs, density ${resourceDensity}`);

    // Create NPCs
    this.createNPCs(npcCount, mapSize);

    // Create Resources
    this.createResources(mapSize, resourceDensity);

    // Create Buildings
    this.createBuildings(mapSize);

    console.log('World generation complete');
  }

  private createNPCs(count: number, mapSize: number) {
    const roles = [
      { id: 'gatherer', name: 'Gatherer', skills: { gathering: 80, crafting: 10, trading: 10 } },
      { id: 'crafter', name: 'Crafter', skills: { gathering: 20, crafting: 80, trading: 20 } },
      { id: 'trader', name: 'Trader', skills: { gathering: 10, crafting: 10, trading: 80 } },
      { id: 'novice', name: 'Novice', skills: { gathering: 5, crafting: 5, trading: 5 } },
      { id: 'veteran', name: 'Veteran', skills: { gathering: 60, crafting: 60, trading: 60 } }
    ];

    for (let i = 0; i < count; i++) {
      const role = roles[i % roles.length];
      const id = `npc_${role.id}_${i}`;
      const name = `${role.name} ${i + 1}`;
      const pos = this.getRandomPos(mapSize);
      
      this.world.createNPC(id, name, pos, role.skills);
    }
  }

  private createResources(mapSize: number, density: number) {
    // Base resources from original initializer
    const resourceTypes = [
      { type: 'bush_berry', props: { edible: true, nutrition: 0.2, value: 2 } },
      { type: 'flower_honey', props: { value: 5 } },
      { type: 'plant_fiber', props: { craftingMaterial: true, value: 1 } },
      { type: 'mushroom_red', props: { edible: true, nutrition: 0.1, value: 3 } },
      { type: 'mushroom_brown', props: { edible: true, nutrition: 0.15, value: 3 } },
      { type: 'herb_healing', props: { value: 10 } },
      { type: 'oak_tree', props: { craftingMaterial: true, value: 5 } },
      { type: 'pine_tree', props: { craftingMaterial: true, value: 5 } },
      { type: 'apple_tree', props: { edible: true, nutrition: 0.3, value: 4 } },
      { type: 'stone', props: { craftingMaterial: true, value: 1 } },
      { type: 'ore_iron', props: { craftingMaterial: true, value: 15 } },
      { type: 'ore_coal', props: { craftingMaterial: true, value: 8 } },
      { type: 'ore_gold', props: { craftingMaterial: true, value: 50 } },
      { type: 'clay_patch', props: { craftingMaterial: true, value: 2 } },
      { type: 'fallen_log', props: { craftingMaterial: true, value: 2 } },
      { type: 'loose_stones', props: { craftingMaterial: true, value: 1 } },
      { type: 'wild_wheat', props: { edible: true, nutrition: 0.1, value: 2 } },
      { type: 'water_source', props: { edible: true, nutrition: 0.05, value: 0 } },
      { type: 'crystal_blue', props: { value: 100 } }
    ];

    const count = Math.floor(mapSize * density * 2); // Roughly 1 resource per tile * density

    for (let i = 0; i < count; i++) {
      const template = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const id = `res_${template.type}_${i}`;
      const pos = this.getRandomPos(mapSize);
      const amt = Math.floor(Math.random() * 10) + 1;
      
      this.world.createResource(id, template.type, pos, amt, template.props);
    }
  }

  private createBuildings(mapSize: number) {
    // Always create a tavern near center
    this.world.createBuilding('b_tavern', 'tavern', { x: mapSize / 2, y: mapSize / 2 });
  }

  private getRandomPos(mapSize: number): Vector2 {
    return {
      x: Math.floor(Math.random() * mapSize),
      y: Math.floor(Math.random() * mapSize)
    };
  }
}
