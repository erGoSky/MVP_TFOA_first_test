import { WorldManager } from '../src/world';
import { initializeTestWorld } from '../src/world-initializer';

describe('WorldInitializer', () => {
  test('should populate world with entities', () => {
    const world = new WorldManager();
    initializeTestWorld(world);

    const state = world.getState();
    
    // Check NPCs
    expect(state.npcs['npc_gatherer']).toBeDefined();
    expect(state.npcs['npc_crafter']).toBeDefined();
    expect(state.npcs['npc_trader']).toBeDefined();
    expect(state.npcs['npc_novice']).toBeDefined();
    expect(state.npcs['npc_veteran']).toBeDefined();

    // Check Tavern
    expect(state.buildings['b_tavern']).toBeDefined();

    // Check Resources (at least some)
    expect(Object.keys(state.resources).length).toBeGreaterThan(0);
    expect(state.resources['res_berry_1']).toBeDefined();
  });
});
