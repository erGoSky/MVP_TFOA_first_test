import { WorldState, NPC, Vector2, Resource, InventoryItem, Building, Skills, BuildingTemplate, Contract, ContractStatus } from './types';
import axios from 'axios';
import { ActionManager } from './actions/action-manager';
import { MoveHandler } from './actions/handlers/move.handler';
import { PickupHandler } from './actions/handlers/pickup.handler';
import { ResourceHandler } from './actions/handlers/resource.handler';
import { ContractHandler } from './actions/handlers/contract.handler';
import { StorageHandler } from './actions/handlers/storage.handler';
import { GeneralHandler } from './actions/handlers/general.handler';
import { CraftingHandler } from './actions/handlers/crafting.handler';
import { TradingHandler } from './actions/handlers/trading.handler';
import { HandActions } from './actions/hand-actions';

const AI_SERVICE_URL = 'http://localhost:8000';

export class WorldManager {
  private state: WorldState;
  private actionManager: ActionManager;

  constructor() {
    this.actionManager = new ActionManager();
    
    const moveHandler = new MoveHandler();
    const pickupHandler = new PickupHandler();
    const resourceHandler = new ResourceHandler();
    const contractHandler = new ContractHandler();
    const storageHandler = new StorageHandler();
    const generalHandler = new GeneralHandler();
    const craftingHandler = new CraftingHandler();
    const tradingHandler = new TradingHandler();
    const handActions = new HandActions();

    this.actionManager.registerHandler('move', moveHandler);
    this.actionManager.registerHandler('pickup', pickupHandler);
    
    ['chop', 'mine'].forEach(act => this.actionManager.registerHandler(act, resourceHandler));
    
    ['create_contract', 'sign_contract', 'pay_prepayment', 'build_step', 'pay_final'].forEach(act => 
        this.actionManager.registerHandler(act, contractHandler)
    );
    
    ['store', 'retrieve'].forEach(act => this.actionManager.registerHandler(act, storageHandler));
    
    ['sleep', 'work'].forEach(act => this.actionManager.registerHandler(act, generalHandler));
    
    ['eat', 'craft'].forEach(act => this.actionManager.registerHandler(act, craftingHandler));
    
    ['sell', 'buy'].forEach(act => this.actionManager.registerHandler(act, tradingHandler));
    
    ['place'].forEach(act => this.actionManager.registerHandler(act, handActions));

    this.state = {
      tick: 0,
      time: 0,
      entities: {},
      npcs: {},
      resources: {},
      buildings: {},
      contracts: {}
    };
  }

  public readonly BUILDING_TEMPLATES: Record<string, BuildingTemplate> = {
      'house_small': {
          id: 'house_small',
          name: 'Small House',
          components: [
              { type: 'wall_stone', count: 4 },
              { type: 'door_plank', count: 1 },
              { type: 'roof_hay', count: 1 }
          ],
          laborCost: 100
      },
      'house_medium': {
          id: 'house_medium',
          name: 'Medium House',
          components: [
              { type: 'wall_log', count: 8 },
              { type: 'door_plank', count: 1 },
              { type: 'window_plank', count: 2 },
              { type: 'roof_leaf', count: 1 }
          ],
          laborCost: 200
      }
  };

  public createNPC(id: string, name: string, position: Vector2, initialSkills?: Skills) {
    const npc: NPC = {
      id,
      type: 'npc',
      name,
      position,
      needs: { hunger: 0, energy: 1, social: 0.5 },
      stats: { health: 100, money: 0, speed: 1 },
      skills: initialSkills || { gathering: 10, crafting: 5, trading: 5 },
      currentAction: 'idle',
      actionState: { inProgress: false, startTime: 0, duration: 0 },
      inventory: [],
      hands: null,
      ownedBuildingIds: []
    };
    this.state.npcs[id] = npc;
    this.state.entities[id] = npc;
  }

  public createResource(id: string, type: string, position: Vector2, amount: number, properties: any = { value: 1 }) {
    const res: Resource = {
      id,
      type: 'resource',
      resourceType: type,
      position,
      amount,
      harvested: false,
      properties
    };
    this.state.resources[id] = res;
    this.state.entities[id] = res;
  }

  public createBuilding(id: string, type: string, position: Vector2) {
    const building: Building = {
      id,
      type: 'building',
      buildingType: type,
      position,
      inventory: [],
      gold: 0
    };
    this.state.buildings[id] = building;
    this.state.entities[id] = building;
  }

  public updateNPC(npc: NPC) {
      if (!npc.currentAction) return;
      const [actionType] = npc.currentAction.split(':');
      
      if (actionType === 'move') {
          this.actionManager.executeAction(npc, npc.currentAction, this);
          return;
      }

      if (this.state.tick < npc.actionState.startTime + npc.actionState.duration) {
          return;
      }

      // 3. Completion Phase
      this.actionManager.executeAction(npc, npc.currentAction, this);

      // Apply Action Costs (once per action completion)
      if (actionType !== 'sleep') {
           const baseEnergyCost = 0.05;
           const baseHungerCost = 0.02;
           npc.needs.energy = Math.max(0, npc.needs.energy - baseEnergyCost);
           npc.needs.hunger = Math.min(1, npc.needs.hunger + baseHungerCost);
      }
  }

  public resetAction(npc: NPC) {
      npc.currentAction = 'idle';
      npc.actionState.inProgress = false;
      npc.actionState.duration = 0;
  }

  public addToInventory(npc: NPC, type: string, quantity: number) {
      console.log(`Adding ${quantity} ${type} to ${npc.name}`);
      const item = npc.inventory.find(i => i.type === type);
      if (item) {
          item.quantity += quantity;
      } else {
          npc.inventory.push({ id: `${type}_${Date.now()}`, type, quantity });
      }
  }

  public removeFromInventory(npc: NPC, type: string, quantity: number) {
      const item = npc.inventory.find(i => i.type === type);
      if (item) {
          item.quantity -= quantity;
          if (item.quantity <= 0) {
              npc.inventory = npc.inventory.filter(i => i.type !== type);
          }
      }
  }

  public hasItem(npc: NPC, type: string, quantity: number): boolean {
      const item = npc.inventory.find(i => i.type === type);
      return item ? item.quantity >= quantity : false;
  }

  private async decideAction(npc: NPC) {
    try {
        const options = [
            ...this.getSurvivalOptions(npc),
            ...this.getResourceOptions(npc),
            ...this.getCraftingOptions(npc),
            ...this.getTradingOptions(npc)
        ];

        const response = await axios.post(`${AI_SERVICE_URL}/calculate_utility`, {
            npc: {
                id: npc.id,
                name: npc.name,
                needs: npc.needs,
                stats: npc.stats,
                skills: npc.skills,
                currentAction: npc.currentAction,
                inventory: npc.inventory,
                homeId: npc.ownedBuildingIds.length > 0 ? npc.ownedBuildingIds[0] : null
            },
            options: options
        });

        const bestAction = response.data.best_action;
        
        if (bestAction) {
            console.log(`NPC ${npc.name} decided to: ${bestAction.name} (U=${response.data.utility.toFixed(2)})`);
            npc.currentAction = bestAction.name;
        }

    } catch (error: any) {
        console.error(`Error deciding action for ${npc.name}:`, error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
  }

  public getDistance(p1: Vector2, p2: Vector2): number {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  private ITEM_REGISTRY: Record<string, string[]> = {
      'bush_berry': ['eat', 'sell'],
      'flower_honey': ['eat', 'sell'],
      'plant_fiber': ['sell', 'craft'],
      'mushroom_red': ['eat', 'sell'],
      'mushroom_brown': ['eat', 'sell'],
      'herb_healing': ['eat', 'sell'],
      'tree_oak': ['craft', 'sell'],
      'tree_pine': ['craft', 'sell'],
      'tree_apple': ['eat', 'sell'], // simplified
      'rock_stone': ['craft', 'sell'],
      'ore_iron': ['craft', 'sell'],
      'ore_coal': ['craft', 'sell'],
      'ore_gold': ['sell'],
      'clay_patch': ['craft', 'sell'],
      'fallen_log': ['craft', 'sell'],
      'loose_stones': ['craft', 'sell'],
      'wild_wheat': ['eat', 'sell'],
      'water_source': ['eat', 'sell'],
      'crystal_blue': ['sell'],
      'plank': ['sell', 'craft'],
      'bread': ['eat', 'sell'],
      'tree': ['craft', 'sell'] // Generic tree fallback
  };

  private getSurvivalOptions(npc: NPC) {
      const options: any[] = [
          { name: 'sleep', type: 'sleep', params: { value: 0.8 } },
          { name: 'work', type: 'work', params: { profit: 10 } }
      ];

      // Eat options based on inventory
      npc.inventory.forEach(item => {
          if (this.ITEM_REGISTRY[item.type]?.includes('eat')) {
               options.push({
                  name: `eat:${item.type}`,
                  type: 'eat',
                  params: { item: item.type, value: 0.7 } // Higher value for eating food
              });
          }
      });

      // Go Home option
      if (npc.ownedBuildingIds.length > 0) {
          const homeId = npc.ownedBuildingIds[0];
          const home = this.state.buildings[homeId];
          if (home) {
              const dist = this.getDistance(npc.position, home.position);
              if (dist > 2.0) {
                  options.push({
                      name: `move:${homeId}`,
                      type: 'move',
                      params: { target: homeId, value: 0.5 }
                  });
              }
          }
      }

      return options;
  }

  private getResourceOptions(npc: NPC) {
      const options: any[] = [];
      Object.values(this.state.resources).forEach(res => {
          if (!res.harvested && res.amount > 0) {
              const dist = this.getDistance(npc.position, res.position);
              if (dist <= 1.5) { // Interaction range
                  options.push({
                      name: `pickup:${res.id}`,
                      type: 'pickup',
                      params: { resource_type: res.resourceType, value: 0.5 }
                  });
              } else {
                  // Move option
                  options.push({
                      name: `move:${res.id}`,
                      type: 'move',
                      params: { target: res.id, value: 0.4 }
                  });
              }
          }
      });
      return options;
  }

  private getCraftingOptions(npc: NPC) {
      const options: any[] = [];
      // Generic check: if item has 'craft' action, maybe it can be turned into something?
      // For MVP, we still hardcode the recipe for planks, but check the registry first.
      
      const woodItems = ['tree', 'tree_oak', 'tree_pine', 'fallen_log'];
      const hasWood = npc.inventory.some(i => woodItems.includes(i.type) && this.ITEM_REGISTRY[i.type]?.includes('craft'));

      if (hasWood) {
          options.push({
              name: 'craft:plank',
              type: 'craft',
              params: { product: 'plank', value: 0.5 }
          });
      }
      
      // Chest crafting (4 wood/plank, 2 stone)
      const hasWoodForChest = npc.inventory.some(i => ['wood', 'plank'].includes(i.type) && i.quantity >= 4);
      const hasStone = npc.inventory.some(i => i.type === 'stone' && i.quantity >= 2);
      if (hasWoodForChest && hasStone && npc.inventory.length > 5) {
          options.push({
              name: 'craft:chest',
              type: 'craft',
              params: { product: 'chest', value: 0.7 } // Higher value when inventory is full
          });
      }
      
      // Sack crafting (3 plant_fiber)
      const hasFiber = npc.inventory.some(i => i.type === 'plant_fiber' && i.quantity >= 3);
      if (hasFiber && npc.inventory.length > 3) {
          options.push({
              name: 'craft:sack',
              type: 'craft',
              params: { product: 'sack', value: 0.6 }
          });
      }
      
      return options;
  }

  private getTradingOptions(npc: NPC) {
      const options: any[] = [];
      
      // Check distance to Tavern
      const tavern = Object.values(this.state.buildings).find(b => b.buildingType === 'tavern');
      if (!tavern) return options;

      const dist = this.getDistance(npc.position, tavern.position);
      if (dist > 1.5) {
           options.push({
              name: `move:${tavern.id}`,
              type: 'move',
              params: { target: tavern.id, value: 0.4 }
          });
          return options;
      }

      // Sell options
      npc.inventory.forEach(item => {
           if (this.ITEM_REGISTRY[item.type]?.includes('sell')) {
               options.push({
                  name: `sell:${item.type}`,
                  type: 'sell',
                  params: { item: item.type, value: 0.6 }
              });
           }
      });

      // Buy options
      if (npc.stats.money >= 5) {
           options.push({
              name: `buy:bread`,
              type: 'buy',
              params: { item: 'bread', value: 0.6 }
          });
      }
      
      // Buy storage if inventory is getting full
      if (npc.stats.money >= 20 && npc.inventory.length > 4) {
          if (!npc.inventory.some(i => i.type === 'sack')) {
              options.push({
                  name: `buy:sack`,
                  type: 'buy',
                  params: { item: 'sack', value: 0.7 }
              });
          }
      }
      
      if (npc.stats.money >= 50 && npc.inventory.length > 6) {
          if (!npc.inventory.some(i => i.type === 'chest')) {
              options.push({
                  name: `buy:chest`,
                  type: 'buy',
                  params: { item: 'chest', value: 0.8 }
              });
          }
      }

      // Housing options
      if (npc.ownedBuildingIds.length === 0 && npc.stats.money >= 100) {
           options.push({
              name: `create_contract:house_small`,
              type: 'create_contract',
              params: { template: 'house_small', value: 0.8 }
          });
      }

      return options;
  }

  public getState(): WorldState {
    return this.state;
  }

  public tick() {
    this.state.tick++;
    this.state.time++;
    Object.values(this.state.npcs).forEach(npc => this.updateNPC(npc));
  }

  // Save/Load functionality
  public async saveState(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const savesDir = path.join(process.cwd(), 'saves');
    
    // Create saves directory if it doesn't exist
    try {
      await fs.mkdir(savesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating saves directory:', error);
    }
    
    const filepath = path.join(savesDir, `${filename}.json`);
    const stateJson = JSON.stringify(this.state, null, 2);
    
    await fs.writeFile(filepath, stateJson, 'utf-8');
    console.log(`World state saved to ${filepath}`);
  }

  public async loadState(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const savesDir = path.join(process.cwd(), 'saves');
    const filepath = path.join(savesDir, `${filename}.json`);
    
    const stateJson = await fs.readFile(filepath, 'utf-8');
    this.state = JSON.parse(stateJson);
    console.log(`World state loaded from ${filepath}`);
  }

  public async getSavesList(): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const savesDir = path.join(process.cwd(), 'saves');
    
    try {
      const files = await fs.readdir(savesDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      // Directory doesn't exist yet
      return [];
    }
  }

  public async deleteSave(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const savesDir = path.join(process.cwd(), 'saves');
    const filepath = path.join(savesDir, `${filename}.json`);
    
    await fs.unlink(filepath);
    console.log(`Save file deleted: ${filepath}`);
  }
}
