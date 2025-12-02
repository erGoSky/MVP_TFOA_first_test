import { EntityManager } from "../entity-manager";
import { NPC, Resource, Building } from "../../types";

describe("EntityManager", () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  describe("createNPC", () => {
    it("should create NPC with default values", () => {
      const npc = entityManager.createNPC("npc1", "Test NPC", { x: 10, y: 20 });

      expect(npc.id).toBe("npc1");
      expect(npc.name).toBe("Test NPC");
      expect(npc.type).toBe("npc");
      expect(npc.position).toEqual({ x: 10, y: 20 });
      expect(npc.needs).toBeDefined();
      expect(npc.stats).toBeDefined();
      expect(npc.skills).toBeDefined();
      expect(npc.personality).toBeDefined();
      expect(npc.inventory).toEqual([]);
    });

    it("should create NPC with custom skills", () => {
      const customSkills = { gathering: 50, crafting: 30, trading: 20 };
      const npc = entityManager.createNPC("npc2", "Skilled NPC", { x: 0, y: 0 }, customSkills);

      expect(npc.skills).toEqual(customSkills);
    });

    it("should create NPC with specified archetype", () => {
      const npc = entityManager.createNPC(
        "npc3",
        "Adventurer",
        { x: 0, y: 0 },
        undefined,
        "adventurer"
      );

      expect(npc.personality.archetype).toBe("adventurer");
    });

    it("should add NPC to entities and npcs collections", () => {
      entityManager.createNPC("npc4", "Test", { x: 0, y: 0 });

      const npcs = entityManager.getNPCs();
      const allEntities = entityManager.getAllEntities();

      expect(npcs).toHaveLength(1);
      expect(allEntities).toHaveLength(1);
      expect(npcs[0].id).toBe("npc4");
    });
  });

  describe("createResource", () => {
    it("should create resource with properties", () => {
      const resource = entityManager.createResource("res1", "tree", { x: 30, y: 40 }, 10);

      expect(resource.id).toBe("res1");
      expect(resource.type).toBe("resource");
      expect(resource.resourceType).toBe("tree");
      expect(resource.position).toEqual({ x: 30, y: 40 });
      expect(resource.amount).toBe(10);
      expect(resource.harvested).toBe(false);
    });

    it("should create resource with custom properties", () => {
      const customProps = { value: 5, quality: "high" };
      const resource = entityManager.createResource(
        "res2",
        "stone",
        { x: 0, y: 0 },
        5,
        customProps
      );

      expect(resource.properties).toEqual(customProps);
    });

    it("should add resource to entities and resources collections", () => {
      entityManager.createResource("res3", "wood", { x: 0, y: 0 }, 20);

      const resources = entityManager.getResources();
      const allEntities = entityManager.getAllEntities();

      expect(resources).toHaveLength(1);
      expect(allEntities).toHaveLength(1);
      expect(resources[0].id).toBe("res3");
    });
  });

  describe("createBuilding", () => {
    it("should create building", () => {
      const building = entityManager.createBuilding("bld1", "house_small", { x: 50, y: 60 });

      expect(building.id).toBe("bld1");
      expect(building.type).toBe("building");
      expect(building.buildingType).toBe("house_small");
      expect(building.position).toEqual({ x: 50, y: 60 });
      expect(building.inventory).toEqual([]);
      expect(building.gold).toBe(0);
    });

    it("should add building to entities and buildings collections", () => {
      entityManager.createBuilding("bld2", "tavern", { x: 0, y: 0 });

      const buildings = entityManager.getBuildings();
      const allEntities = entityManager.getAllEntities();

      expect(buildings).toHaveLength(1);
      expect(allEntities).toHaveLength(1);
      expect(buildings[0].id).toBe("bld2");
    });
  });

  describe("removeEntity", () => {
    it("should remove NPC from all collections", () => {
      entityManager.createNPC("npc5", "To Remove", { x: 0, y: 0 });
      entityManager.removeEntity("npc5");

      const npcs = entityManager.getNPCs();
      const allEntities = entityManager.getAllEntities();

      expect(npcs).toHaveLength(0);
      expect(allEntities).toHaveLength(0);
    });

    it("should remove resource from all collections", () => {
      entityManager.createResource("res4", "tree", { x: 0, y: 0 }, 10);
      entityManager.removeEntity("res4");

      const resources = entityManager.getResources();
      const allEntities = entityManager.getAllEntities();

      expect(resources).toHaveLength(0);
      expect(allEntities).toHaveLength(0);
    });

    it("should remove building from all collections", () => {
      entityManager.createBuilding("bld3", "house", { x: 0, y: 0 });
      entityManager.removeEntity("bld3");

      const buildings = entityManager.getBuildings();
      const allEntities = entityManager.getAllEntities();

      expect(buildings).toHaveLength(0);
      expect(allEntities).toHaveLength(0);
    });

    it("should handle removing non-existent entity gracefully", () => {
      expect(() => entityManager.removeEntity("non-existent")).not.toThrow();
    });
  });

  describe("updateEntity", () => {
    it("should update NPC properties", () => {
      const npc = entityManager.createNPC("npc6", "Test", { x: 0, y: 0 });
      entityManager.updateEntity("npc6", { position: { x: 100, y: 200 } });

      const updatedNPC = entityManager.getEntity("npc6") as NPC;
      expect(updatedNPC.position).toEqual({ x: 100, y: 200 });
    });

    it("should update resource properties", () => {
      entityManager.createResource("res5", "tree", { x: 0, y: 0 }, 10);
      entityManager.updateEntity("res5", { amount: 5, harvested: true });

      const updatedResource = entityManager.getEntity("res5") as Resource;
      expect(updatedResource.amount).toBe(5);
      expect(updatedResource.harvested).toBe(true);
    });

    it("should handle updating non-existent entity gracefully", () => {
      expect(() => entityManager.updateEntity("non-existent", { foo: "bar" })).not.toThrow();
    });
  });

  describe("getters", () => {
    beforeEach(() => {
      entityManager.createNPC("npc7", "NPC1", { x: 0, y: 0 });
      entityManager.createNPC("npc8", "NPC2", { x: 0, y: 0 });
      entityManager.createResource("res6", "tree", { x: 0, y: 0 }, 10);
      entityManager.createBuilding("bld4", "house", { x: 0, y: 0 });
    });

    it("should return all NPCs", () => {
      const npcs = entityManager.getNPCs();
      expect(npcs).toHaveLength(2);
    });

    it("should return all resources", () => {
      const resources = entityManager.getResources();
      expect(resources).toHaveLength(1);
    });

    it("should return all buildings", () => {
      const buildings = entityManager.getBuildings();
      expect(buildings).toHaveLength(1);
    });

    it("should return all entities", () => {
      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(4);
    });

    it("should get specific entity by ID", () => {
      const entity = entityManager.getEntity("npc7");
      expect(entity).toBeDefined();
      expect(entity?.id).toBe("npc7");
    });

    it("should return undefined for non-existent entity", () => {
      const entity = entityManager.getEntity("non-existent");
      expect(entity).toBeUndefined();
    });
  });

  describe("getState", () => {
    it("should return state with all collections", () => {
      entityManager.createNPC("npc9", "Test", { x: 0, y: 0 });
      entityManager.createResource("res7", "tree", { x: 0, y: 0 }, 10);

      const state = entityManager.getState();

      expect(state).toHaveProperty("entities");
      expect(state).toHaveProperty("npcs");
      expect(state).toHaveProperty("resources");
      expect(state).toHaveProperty("buildings");
      expect(Object.keys(state.npcs)).toHaveLength(1);
      expect(Object.keys(state.resources)).toHaveLength(1);
    });
  });

  describe("reset", () => {
    it("should clear all entities", () => {
      entityManager.createNPC("npc10", "Test", { x: 0, y: 0 });
      entityManager.createResource("res8", "tree", { x: 0, y: 0 }, 10);
      entityManager.createBuilding("bld5", "house", { x: 0, y: 0 });

      entityManager.reset();

      expect(entityManager.getNPCs()).toHaveLength(0);
      expect(entityManager.getResources()).toHaveLength(0);
      expect(entityManager.getBuildings()).toHaveLength(0);
      expect(entityManager.getAllEntities()).toHaveLength(0);
    });
  });

  describe("BUILDING_TEMPLATES", () => {
    it("should have building templates defined", () => {
      expect(entityManager.BUILDING_TEMPLATES).toBeDefined();
      expect(entityManager.BUILDING_TEMPLATES.house_small).toBeDefined();
      expect(entityManager.BUILDING_TEMPLATES.house_medium).toBeDefined();
    });

    it("should have correct template structure", () => {
      const template = entityManager.BUILDING_TEMPLATES.house_small;
      expect(template.id).toBe("house_small");
      expect(template.name).toBe("Small House");
      expect(template.components).toBeDefined();
      expect(template.laborCost).toBe(100);
    });
  });
});
