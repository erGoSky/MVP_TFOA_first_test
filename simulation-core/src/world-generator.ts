import { WorldManager } from './world';
import { Vector2, BiomeType, Tile, ResourceType } from './types';
import { PerlinNoise } from './utils/perlin';
import { RESOURCE_TYPES, getResourceMetadata } from './constants/entities';

export interface GenerationParams {
  mapSize?: number;
  npcCount?: number;
  resourceDensity?: number; // 0-1
  seed?: number;
}

export class WorldGenerator {
  private world: WorldManager;
  private noise: PerlinNoise;

  constructor(world: WorldManager) {
    this.world = world;
    this.noise = new PerlinNoise();
  }

  public generate(params: GenerationParams = {}) {
    this.world.reset();
    
    const mapSize = params.mapSize || 100;
    const npcCount = params.npcCount || 5;
    const resourceDensity = params.resourceDensity || 0.1;
    const seed = params.seed || Math.random();

    console.log(`Generating world with size ${mapSize}, seed ${seed}`);

    this.world.getState().width = mapSize;
    this.world.getState().height = mapSize;
    this.noise = new PerlinNoise(seed);

    // 1. Generate Terrain (Biomes)
    this.generateTerrain(mapSize);

    // 2. Create Resources based on Biomes
    this.populateResources(mapSize, resourceDensity);

    // 3. Create Buildings (Tavern)
    this.createBuildings(mapSize);

    // 4. Create NPCs
    this.createNPCs(npcCount, mapSize);

    console.log('World generation complete');
  }

  private generateTerrain(mapSize: number) {
    this.world.getState().tiles = [];

    for (let y = 0; y < mapSize; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < mapSize; x++) {
            const scale = 0.05;
            const elevation = this.noise.noise(x * scale, y * scale, 0);
            const moisture = this.noise.noise(x * scale + 100, y * scale + 100, 0);

            const biome = this.getBiome(elevation, moisture);

            row.push({ x, y, biome, elevation, moisture });
        }
        this.world.getState().tiles.push(row);
    }
  }

  private getBiome(e: number, m: number): BiomeType {
      if (e < -0.2) return 'water';
      if (e > 0.6) return 'mountain';
      if (m < -0.3) return 'desert';
      if (m > 0.4) return 'swamp';
      if (m > 0.1) return 'forest';
      return 'plains';
  }

  private populateResources(mapSize: number, density: number) {
      for (let y = 0; y < mapSize; y++) {
          for (let x = 0; x < mapSize; x++) {
              const tile = this.world.getState().tiles[y][x];
              
              if (tile.biome === 'water') continue;
              if (Math.random() > density) continue;

              const resource = this.getResourceForBiome(tile.biome);
              if (resource) {
                  const id = `res_${resource.type}_${x}_${y}`;
                  const amt = Math.floor(Math.random() * 5) + 1;
                  this.world.createResource(id, resource.type, {x, y}, amt, resource.props);
              }
          }
      }
  }

  private getResourceForBiome(biome: BiomeType): { type: ResourceType, props: any } | null {
      const rand = Math.random();
      
      const createResource = (type: ResourceType) => {
          const metadata = getResourceMetadata(type);
          return {
              type,
              props: {
                  edible: metadata.edible,
                  nutrition: metadata.nutrition,
                  craftingMaterial: metadata.craftingMaterial,
                  value: metadata.value
              }
          };
      };
      
      switch (biome) {
          case 'forest':
              if (rand < 0.5) return createResource(RESOURCE_TYPES.TREE_OAK);
              if (rand < 0.7) return createResource(RESOURCE_TYPES.TREE_PINE);
              if (rand < 0.8) return createResource(RESOURCE_TYPES.BUSH_BERRY);
              if (rand < 0.9) return createResource(RESOURCE_TYPES.MUSHROOM_BROWN);
              return createResource(RESOURCE_TYPES.FALLEN_LOG);
          
          case 'plains':
              if (rand < 0.3) return createResource(RESOURCE_TYPES.WILD_WHEAT);
              if (rand < 0.5) return createResource(RESOURCE_TYPES.FLOWER_HONEY);
              if (rand < 0.6) return createResource(RESOURCE_TYPES.TREE_APPLE);
              return null;

          case 'desert':
              if (rand < 0.05) return createResource(RESOURCE_TYPES.WATER_SOURCE);
              if (rand < 0.3) return createResource(RESOURCE_TYPES.LOOSE_STONES);
              return null;

          case 'mountain':
              if (rand < 0.4) return createResource(RESOURCE_TYPES.ROCK_STONE);
              if (rand < 0.6) return createResource(RESOURCE_TYPES.ORE_COAL);
              if (rand < 0.7) return createResource(RESOURCE_TYPES.ORE_IRON);
              if (rand < 0.75) return createResource(RESOURCE_TYPES.ORE_GOLD);
              return null;

          case 'swamp':
              if (rand < 0.4) return createResource(RESOURCE_TYPES.PLANT_FIBER);
              if (rand < 0.6) return createResource(RESOURCE_TYPES.MUSHROOM_RED);
              if (rand < 0.8) return createResource(RESOURCE_TYPES.CLAY_PATCH);
              return createResource(RESOURCE_TYPES.HERB_HEALING);
            
          default:
              return null;
      }
  }

  private createBuildings(mapSize: number) {
    const center = Math.floor(mapSize / 2);
    let pos = { x: center, y: center };
    
    let radius = 0;
    while (!this.isValidBuildSpot(pos) && radius < mapSize/2) {
        radius++;
        const angle = Math.random() * Math.PI * 2;
        pos.x = Math.floor(center + Math.cos(angle) * radius);
        pos.y = Math.floor(center + Math.sin(angle) * radius);
    }

    if (this.isValidBuildSpot(pos)) {
        this.world.createBuilding('b_tavern', 'tavern', pos);
        
        // Place a chest next to the tavern
        const chestPos = { x: pos.x + 1, y: pos.y };
        if (this.isValidBuildSpot(chestPos)) {
            this.world.createContainer('c_tavern_chest', 'chest_small', chestPos, 20);
            // Add some starter items
            const chest = this.world.getState().buildings['c_tavern_chest'].container;
            if (chest) {
                chest.contents.push({ id: 'i_starter_bread', type: 'bread', quantity: 5 });
                chest.contents.push({ id: 'i_starter_water', type: 'water_flask', quantity: 5 });
            }
        }
        
        // Place workstations around the tavern
        const workstations = [
            { id: 'ws_crafting_table', type: 'crafting_table', offset: { x: 2, y: 0 } },
            { id: 'ws_furnace', type: 'furnace', offset: { x: 0, y: 2 } },
            { id: 'ws_anvil', type: 'anvil', offset: { x: -2, y: 0 } },
            { id: 'ws_loom', type: 'loom', offset: { x: 0, y: -2 } },
        ];
        
        workstations.forEach(ws => {
            const wsPos = { x: pos.x + ws.offset.x, y: pos.y + ws.offset.y };
            if (this.isValidBuildSpot(wsPos)) {
                this.world.createBuilding(ws.id, ws.type, wsPos);
            }
        });
    }
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
      
      let pos = this.getRandomPos(mapSize);
      let attempts = 0;
      while (!this.isValidSpawnSpot(pos) && attempts < 50) {
          pos = this.getRandomPos(mapSize);
          attempts++;
      }
      
      this.world.createNPC(id, name, pos, role.skills);
    }
  }

  private getRandomPos(mapSize: number): Vector2 {
    return {
      x: Math.floor(Math.random() * mapSize),
      y: Math.floor(Math.random() * mapSize)
    };
  }

  private isValidSpawnSpot(pos: Vector2): boolean {
      if (pos.x < 0 || pos.x >= this.world.getState().width || pos.y < 0 || pos.y >= this.world.getState().height) return false;
      const tile = this.world.getState().tiles[pos.y][pos.x];
      return tile.biome !== 'water' && tile.biome !== 'mountain';
  }

  private isValidBuildSpot(pos: Vector2): boolean {
      return this.isValidSpawnSpot(pos);
  }
}
