import React, { useState } from "react";
import { Tooltip } from "../common/Tooltip";

// Local icon constants for UI
const ENTITY_ICONS = {
  NPC: "👨‍🌾",
  BUILDING: "🏛️",
  TREE: "🌲",
  ROCK: "🪨",
  FOOD: "🍎",
};
import type { Entity } from "../../types/world";
import "./EditorPanel.scss";

export type EditorTool = "select" | "place" | "delete";
export type EntityType = "npc" | "resource" | "building";

export interface EditorState {
  tool: EditorTool;
  selectedType: EntityType;
  resourceType: string;
  buildingType: string;
  npcArchetype: string;
}

interface EditorPanelProps {
  editorState: EditorState;
  onStateChange: (state: EditorState) => void;
  selectedEntity: Entity | null;
  onUpdateEntity: (id: string, updates: Partial<Entity>) => void;
  onDeselect: () => void;
}

interface EntityCategory {
  name: string;
  icon: string;
  items: { value: string; label: string; description: string }[];
}

const RESOURCE_CATEGORIES: EntityCategory[] = [
  {
    name: "Trees",
    icon: "🌲",
    items: [
      { value: "tree_oak", label: "Oak Tree", description: "Provides wood" },
      { value: "tree_pine", label: "Pine Tree", description: "Provides wood" },
      { value: "tree_apple", label: "Apple Tree", description: "Provides apples and wood" },
    ],
  },
  {
    name: "Rocks & Ores",
    icon: "🪨",
    items: [
      { value: "rock_stone", label: "Stone Rock", description: "Provides stone" },
      { value: "ore_iron", label: "Iron Ore", description: "Provides iron" },
      { value: "ore_coal", label: "Coal Ore", description: "Provides coal" },
      { value: "ore_gold", label: "Gold Ore", description: "Provides gold" },
    ],
  },
  {
    name: "Plants & Food",
    icon: "🌿",
    items: [
      { value: "bush_berry", label: "Berry Bush", description: "Provides berries" },
      { value: "plant_fiber", label: "Fiber Plant", description: "Provides fiber" },
      { value: "wild_wheat", label: "Wild Wheat", description: "Provides wheat" },
    ],
  },
  {
    name: "Other",
    icon: "💧",
    items: [{ value: "water_source", label: "Water Source", description: "Provides water" }],
  },
];

const NPC_CATEGORIES: EntityCategory[] = [
  {
    name: "Villagers",
    icon: "👨‍🌾",
    items: [
      { value: "farmer", label: "Farmer", description: "Grows food" },
      { value: "builder", label: "Builder", description: "Constructs buildings" },
      { value: "artisan", label: "Artisan", description: "Crafts items" },
    ],
  },
  {
    name: "Specialists",
    icon: "🎓",
    items: [
      { value: "merchant", label: "Merchant", description: "Trades goods" },
      { value: "scholar", label: "Scholar", description: "Researches knowledge" },
    ],
  },
  {
    name: "Outsiders",
    icon: "🏕️",
    items: [
      { value: "hermit", label: "Hermit", description: "Lives in isolation" },
      { value: "adventurer", label: "Adventurer", description: "Explores the world" },
      { value: "warrior", label: "Warrior", description: "Fights enemies" },
    ],
  },
];

const BUILDING_CATEGORIES: EntityCategory[] = [
  {
    name: "Structures",
    icon: "🏠",
    items: [
      { value: "house_small", label: "Small House", description: "Basic dwelling" },
      { value: "house_medium", label: "Medium House", description: "Larger dwelling" },
      { value: "tavern", label: "Tavern", description: "Trading hub" },
    ],
  },
  {
    name: "Workstations",
    icon: "🔨",
    items: [
      { value: "crafting_table", label: "Crafting Table", description: "Basic crafting" },
      { value: "furnace", label: "Furnace", description: "Smelting ores" },
      { value: "anvil", label: "Anvil", description: "Metalworking" },
      { value: "loom", label: "Loom", description: "Weaving" },
    ],
  },
  {
    name: "Containers",
    icon: "📦",
    items: [
      { value: "chest_small", label: "Small Chest", description: "Storage container" },
      { value: "barrel", label: "Barrel", description: "Liquid storage" },
    ],
  },
];

export const EditorPanel: React.FC<EditorPanelProps> = ({
  editorState,
  onStateChange,
  selectedEntity,
  onUpdateEntity,
  onDeselect,
}) => {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [localJson, setLocalJson] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Update local JSON when selected entity changes
  React.useEffect(() => {
    if (selectedEntity) {
      const { id, type, position, ...rest } = selectedEntity;
      setLocalJson(JSON.stringify(rest, null, 2));
      setJsonError(null);
    } else {
      setLocalJson("");
    }
  }, [selectedEntity?.id]);

  const handleJsonSave = () => {
    if (!selectedEntity) return;
    try {
      const updates = JSON.parse(localJson);
      onUpdateEntity(selectedEntity.id, updates);
      setJsonError(null);
      onDeselect();
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const updateState = (updates: Partial<EditorState>) => {
    onStateChange({ ...editorState, ...updates });
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const filterItems = (items: { value: string; label: string; description: string }[]) => {
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="editor-panel">
      <div className="tool-section">
        <h4>Tools</h4>
        <div className="tool-buttons">
          <Tooltip content="Select and move entities">
            <button
              className={`tool-btn ${editorState.tool === "select" ? "active" : ""}`}
              onClick={() => updateState({ tool: "select" })}
            >
              👆
            </button>
          </Tooltip>
          <Tooltip content="Place new entities">
            <button
              className={`tool-btn ${editorState.tool === "place" ? "active" : ""}`}
              onClick={() => updateState({ tool: "place" })}
            >
              ➕
            </button>
          </Tooltip>
          <Tooltip content="Delete entities">
            <button
              className={`tool-btn ${editorState.tool === "delete" ? "active" : ""}`}
              onClick={() => updateState({ tool: "delete" })}
            >
              🗑️
            </button>
          </Tooltip>
        </div>
      </div>

      {editorState.tool === "place" && (
        <div className="place-section">
          <h4>Entity Type</h4>
          <div className="type-buttons">
            <button
              className={`type-btn ${editorState.selectedType === "npc" ? "active" : ""}`}
              onClick={() => updateState({ selectedType: "npc" })}
            >
              {ENTITY_ICONS.NPC} NPC
            </button>
            <button
              className={`type-btn ${editorState.selectedType === "resource" ? "active" : ""}`}
            >
              {ENTITY_ICONS.TREE} Resource
            </button>
            <button
              className={`type-btn ${editorState.selectedType === "building" ? "active" : ""}`}
              onClick={() => updateState({ selectedType: "building" })}
            >
              {ENTITY_ICONS.BUILDING} Building
            </button>
          </div>

          {(editorState.selectedType === "resource" ||
            editorState.selectedType === "building" ||
            editorState.selectedType === "npc") && (
            <>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="categories">
                {(editorState.selectedType === "resource"
                  ? RESOURCE_CATEGORIES
                  : editorState.selectedType === "building"
                    ? BUILDING_CATEGORIES
                    : NPC_CATEGORIES
                ).map((category) => {
                  const filteredItems = filterItems(category.items);
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={category.name} className="category">
                      <div
                        className="category-header"
                        onClick={() => toggleCategory(category.name)}
                      >
                        <span className="expand-icon">
                          {expandedCategories.has(category.name) ? "▼" : "▶"}
                        </span>
                        <span className="category-icon">{category.icon}</span>
                        <span className="category-name">{category.name}</span>
                      </div>
                      {expandedCategories.has(category.name) && (
                        <div className="category-items">
                          {filteredItems.map((item) => (
                            <Tooltip key={item.value} content={item.description}>
                              <button
                                className={`item-btn ${
                                  (editorState.selectedType === "resource" &&
                                    editorState.resourceType === item.value) ||
                                  (editorState.selectedType === "building" &&
                                    editorState.buildingType === item.value) ||
                                  (editorState.selectedType === "npc" &&
                                    editorState.npcArchetype === item.value)
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  updateState(
                                    editorState.selectedType === "resource"
                                      ? { resourceType: item.value }
                                      : editorState.selectedType === "building"
                                        ? { buildingType: item.value }
                                        : { npcArchetype: item.value }
                                  )
                                }
                              >
                                {item.label}
                              </button>
                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {editorState.tool === "select" && selectedEntity && (
        <div className="edit-section">
          <h4>Edit Entity: {selectedEntity.id}</h4>
          <div className="json-editor">
            <label>Properties (JSON):</label>
            <textarea value={localJson} onChange={(e) => setLocalJson(e.target.value)} rows={10} />
            {jsonError && <div className="error-msg">{jsonError}</div>}
            <button className="save-btn" onClick={handleJsonSave}>
              💾 Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        {editorState.tool === "select" && !selectedEntity && <p>Click entity to select & edit.</p>}
        {editorState.tool === "select" && selectedEntity && <p>Edit properties above.</p>}
        {editorState.tool === "place" && <p>Click on map to place {editorState.selectedType}.</p>}
        {editorState.tool === "delete" && <p>Click entity to delete.</p>}
      </div>
    </div>
  );
};
