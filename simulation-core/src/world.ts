import { WorldState, NPC, Vector2, Resource, InventoryItem, Building, Skills, BuildingTemplate, Contract, ContractStatus, Entity } from './types';
import axios from 'axios';
import { PersonalityGenerator } from './personality/generator';
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
import { IdleHandler } from './actions/handlers/idle.handler';

const AI_SERVICE_URL = 'http://localhost:8000';

import { MemorySystem } from './ai/memory.system';
import { GoalManager } from './ai/goal-manager';
import { GoalGenerator } from './ai/goal-generator';
import { PlanExecutor } from './ai/plan-executor';

export class WorldManager {
  private state: WorldState;
  private actionManager: ActionManager;
  private memorySystem: MemorySystem;
  private goalManager: GoalManager;

  constructor() {
    this.actionManager = new ActionManager();
    this.memorySystem = new MemorySystem();
    this.goalManager = new GoalManager();
    
    // ... handlers ...
    const moveHandler = new MoveHandler();
    const pickupHandler = new PickupHandler();
    const resourceHandler = new ResourceHandler();
    const contractHandler = new ContractHandler();
    const storageHandler = new StorageHandler();
    const generalHandler = new GeneralHandler();
    const craftingHandler = new CraftingHandler();
    const tradingHandler = new TradingHandler();
    const handActions = new HandActions();
    const idleHandler = new IdleHandler();

    this.actionManager.registerHandler('move', moveHandler);
    this.actionManager.registerHandler('pickup', pickupHandler);
    
    ['chop', 'mine'].forEach(act => this.actionManager.registerHandler(act, resourceHandler));
    
    ['create_contract', 'sign_contract', 'pay_prepayment', 'build_step', 'pay_final'].forEach(act => 
        this.actionManager.registerHandler(act, contractHandler)
    );
    
    ['store_item', 'retrieve_item'].forEach(act => this.actionManager.registerHandler(act, storageHandler));
    
    ['eat', 'drink', 'sleep'].forEach(act => this.actionManager.registerHandler(act, generalHandler));
    
    ['craft', 'process', 'repair'].forEach(act => this.actionManager.registerHandler(act, craftingHandler));
    
    ['buy', 'sell', 'post_order', 'accept_order'].forEach(act => this.actionManager.registerHandler(act, tradingHandler));
    
    ['equip', 'unequip'].forEach(act => this.actionManager.registerHandler(act, handActions));
    
    this.actionManager.registerHandler('idle', idleHandler);
    
    // Initialize state
    this.state = {
      tick: 0,
      time: 0,
      width: 100,
      height: 100,
      tiles: [],
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

  public createNPC(id: string, name: string, position: Vector2, initialSkills?: Skills, archetype?: string) {
    const npc: NPC = {
      id,
      type: 'npc',
      name,
      position,
      needs: { hunger: 0, energy: 1, social: 0.5 },
      stats: { health: 100, money: 0, speed: 1 },
      skills: initialSkills || { gathering: 10, crafting: 5, trading: 5 },
      personality: PersonalityGenerator.generate(archetype),
      currentAction: null,
      actionState: { inProgress: false, startTime: 0, duration: 0 },
      inventory: [],
      hands: null,
      ownedBuildingIds: [],
      memory: {
          locations: new Map(),
          lastSeen: new Map()
      }
    };
    this.state.npcs[id] = npc;
    this.state.entities[id] = npc;
    
    // Log personality for debugging
    console.log(`Created NPC ${name} with personality: ${PersonalityGenerator.describe(npc.personality)} (${npc.personality.archetype})`);
  }

  public createResource(id: string, type: any, position: Vector2, amount: number, properties: any = { value: 1 }) {
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

  public createContainer(id: string, type: string, position: Vector2, capacity: number = 10) {
    const entity: Entity = {
      id,
      type: 'building', // Containers are buildings for now? Or generic entities?
      // If I use 'building', it goes to buildings map. If 'resource', resources map.
      // Let's use 'building' for placed containers like chests.
      position,
      container: {
        capacity,
        contents: [],
        isOpen: false
      }
    };
    // But wait, Building interface has specific fields.
    // If I use 'building', I need to satisfy Building interface.
    // Let's make a generic entity list or add to buildings.
    // For now, let's treat standalone containers as buildings with a specific buildingType.
    
    const building: Building = {
        ...entity,
        type: 'building',
        buildingType: type, // e.g. 'chest_small'
        inventory: [], // Shop inventory? Or should I map container.contents to this?
        // The Building interface has 'inventory'. My new Entity interface has 'container'.
        // This is a bit redundant.
        // Let's use the new 'container' property for the actual storage logic.
        gold: 0
    };
    
    this.state.buildings[id] = building;
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

  public async updateNPC(npc: NPC) {
    // 1. Update Memory
    this.memorySystem.updateMemory(npc, this.state);
    
    // 2. Handle Active Action
    if (npc.actionState.inProgress) {
        // Check if action is complete
        const elapsed = this.state.tick - npc.actionState.startTime;
        if (elapsed >= npc.actionState.duration) {
            // Execute action effect
            if (npc.currentAction) {
                this.actionManager.executeAction(npc, npc.currentAction, this);
                PlanExecutor.completeAction(npc, this);
            }
        }
        return; // Busy executing
    }

    // 3. Check Plan Status
    if (PlanExecutor.hasActivePlan(npc)) {
        // Continue existing plan
        PlanExecutor.startNextAction(npc, this);
        return;
    }

    // 4. Goal Management (if no active plan)
    // Generate new goals
    const newGoals = GoalGenerator.generateGoals(npc, this.state, this.state.tick);
    newGoals.forEach(goal => this.goalManager.addGoal(npc.id, goal));

    // Get highest priority goal
    const activeGoal = this.goalManager.getNextGoal(npc.id);
    
    if (activeGoal) {
        // 5. Request Plan for Goal
        console.log(`🎯 ${npc.name} pursuing goal: ${activeGoal.type} (${activeGoal.id})`);
        const plan = await this.requestPlan(npc, activeGoal);
        
        if (plan && plan.length > 0) {
            console.log(`📝 Plan received for ${npc.name}: ${plan.join(' -> ')}`);
            npc.actionPlan = {
                actions: plan,
                currentIndex: 0
            };
            PlanExecutor.startNextAction(npc, this);
        } else {
            console.log(`⚠️ No plan found for goal ${activeGoal.id}, abandoning.`);
            this.goalManager.abandonGoal(npc.id, "No plan found");
            // Fallback to idle
            npc.currentAction = 'idle';
            npc.actionState = { inProgress: true, startTime: this.state.tick, duration: 10 };
        }
    } else {
        // No goals? Idle.
        npc.currentAction = 'idle';
        npc.actionState = { inProgress: true, startTime: this.state.tick, duration: 10 };
    }
  }

  private async requestPlan(npc: NPC, goal: any): Promise<string[] | null> {
      try {
          const worldStateForAI = this.getWorldStateForAI(npc);
          
          const response = await axios.post(`${AI_SERVICE_URL}/plan_action_enhanced`, {
              npc_state: {
                  id: npc.id,
                  name: npc.name,
                  position: npc.position,
                  inventory: npc.inventory,
                  skills: npc.skills,
                  stats: npc.stats,
                  personality: npc.personality
              },
              goal: goal,
              world_state: worldStateForAI
          });

          if (response.data.success) {
              return response.data.plan;
          } else {
              console.warn(`Planning failed for ${npc.name}: ${response.data.error}`);
              return null;
          }
      } catch (error: any) {
          console.error(`API Error for ${npc.name}:`, error.message);
          return null;
      }
  }

  private getWorldStateForAI(npc: NPC): any {
      // Serialize relevant world state for AI planning
      // This should be optimized to not send the entire world
      
      // 1. Get known resources from memory
      const knownResources: Record<string, any> = {};
      npc.memory.locations.forEach((mem, id) => {
          if (mem.type === 'resource') {
              knownResources[id] = {
                  type: mem.subtype,
                  position: mem.position
              };
          }
      });

      // 2. Get market prices (global knowledge for now)
      // TODO: Implement actual market system
      const marketPrices: Record<string, number> = {
          'wood': 5,
          'stone': 2,
          'iron_ore': 10,
          'gold_ore': 50,
          'sword': 50,
          'bread': 5
      };

      return {
          resources: knownResources,
          buildings: {}, // TODO: Add known buildings
          market_prices: marketPrices,
          quest_board: [] // TODO: Add quests
      };
  }

  public resetAction(npc: NPC) {
      npc.currentAction = null;
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
      let foundVisible = false;

      // 1. Check visible resources
      Object.values(this.state.resources).forEach(res => {
          if (!res.harvested && res.amount > 0) {
              const dist = this.getDistance(npc.position, res.position);
              
              // Only consider resources within visual range (10 tiles)
              if (dist <= 10) {
                  foundVisible = true;
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
          }
      });

      // 2. If no visible resources, check memory
      if (!foundVisible && npc.memory) {
          // Look for any resource in memory
          // In a real system, we'd look for specific needs (e.g., "I need wood")
          // For now, let's just go to the nearest known resource if we have nothing else to do
          
          // We can iterate over memory locations
          npc.memory.locations.forEach((mem, id) => {
              if (mem.type === 'resource') {
                   // Check if we are already there (and it's gone, since we didn't see it above)
                   const dist = this.getDistance(npc.position, mem.position);
                   if (dist < 2) {
                       // We are at the remembered location but didn't see it.
                       // It must be gone. Forget it.
                       this.memorySystem.forgetLocation(npc, id);
                   } else {
                       // Move to remembered location
                       options.push({
                           name: `move_mem:${id}`, // Special action name? Or just move to coords?
                           // The MoveHandler expects a targetId. If the entity is gone, it might fail.
                           // We should probably move to position.
                           // But MoveHandler currently takes targetId.
                           // Let's stick to targetId for now, but we might need to update MoveHandler to support coords.
                           // Actually, if the entity is not in this.state.entities, MoveHandler might fail.
                           
                           // Let's check MoveHandler.
                           // If I pass a targetId that doesn't exist, MoveHandler will fail.
                           // So I need to verify if MoveHandler supports moving to coordinates.
                       });
                   }
              }
          });
      }
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
    
    // Update NPC memory and actions
    Object.values(this.state.npcs).forEach(npc => {
        // Update memory based on visible entities (simple radius check for now)
        const visibleEntities = Object.values(this.state.entities).filter(e => 
            this.getDistance(npc.position, e.position) <= 10 // Visual range
        );
        this.memorySystem.updateMemory(npc, visibleEntities, this.state.tick);
        
        this.updateNPC(npc);
    });
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
    
    // Create a copy of state without the redundant entities map to avoid duplication
    const stateToSave = {
      ...this.state,
      entities: {} 
    };
    
    const stateJson = JSON.stringify(stateToSave, null, 2);
    
    await fs.writeFile(filepath, stateJson, 'utf-8');
    console.log(`World state saved to ${filepath}`);
  }

  public async loadState(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const savesDir = path.join(process.cwd(), 'saves');
    const filepath = path.join(savesDir, `${filename}.json`);
    
    const stateJson = await fs.readFile(filepath, 'utf-8');
    const loadedState = JSON.parse(stateJson);
    
    // Reconstruct the entities map from the specific collections
    loadedState.entities = {};
    
    // Add NPCs
    Object.values(loadedState.npcs).forEach((npc: any) => {
      loadedState.entities[npc.id] = npc;
    });
    
    // Add Resources
    Object.values(loadedState.resources).forEach((res: any) => {
      loadedState.entities[res.id] = res;
    });
    
    // Add Buildings
    Object.values(loadedState.buildings).forEach((b: any) => {
      loadedState.entities[b.id] = b;
    });
    
    this.state = loadedState;
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

  // World Management
  public reset(): void {
    this.state = {
      tick: 0,
      time: 0,
      width: 100,
      height: 100,
      tiles: [],
      entities: {},
      npcs: {},
      resources: {},
      buildings: {},
      contracts: {}
    };
    console.log('World reset');
  }

  public removeEntity(id: string): void {
    const entity = this.state.entities[id];
    if (!entity) return;

    // Remove from specific collection
    if (entity.type === 'npc') delete this.state.npcs[id];
    else if (entity.type === 'resource') delete this.state.resources[id];
    else if (entity.type === 'building') delete this.state.buildings[id];

    // Remove from main entities map
    delete this.state.entities[id];
    console.log(`Entity removed: ${id}`);
  }

  public updateEntity(id: string, updates: Partial<any>): void {
    const entity = this.state.entities[id];
    if (!entity) return;

    // Update properties
    Object.assign(entity, updates);
    
    // Also update in specific collection
    if (entity.type === 'npc') Object.assign(this.state.npcs[id], updates);
    else if (entity.type === 'resource') Object.assign(this.state.resources[id], updates);
    else if (entity.type === 'building') Object.assign(this.state.buildings[id], updates);
    
    console.log(`Entity updated: ${id}`);
  }
}
