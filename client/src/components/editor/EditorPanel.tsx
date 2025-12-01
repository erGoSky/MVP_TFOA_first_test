import React, { useState } from 'react';

// Local icon constants for UI
const ENTITY_ICONS = {
  NPC: '👨‍🌾',
  BUILDING: '🏛️',
  TREE: '🌲',
  ROCK: '🪨',
  FOOD: '🍎',
};
import type { Entity } from '../../types/world';
import './EditorPanel.scss';

export type EditorTool = 'select' | 'place' | 'delete';
export type EntityType = 'npc' | 'resource' | 'building';

export interface EditorState {
  tool: EditorTool;
  selectedType: EntityType;
  resourceType: string;
  buildingType: string;
}

interface EditorPanelProps {
  editorState: EditorState;
  onStateChange: (state: EditorState) => void;
  selectedEntity: Entity | null;
  onUpdateEntity: (id: string, updates: Partial<Entity>) => void;
  onDeselect: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  editorState, 
  onStateChange,
  selectedEntity,
  onUpdateEntity,
  onDeselect
}) => {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [localJson, setLocalJson] = useState<string>('');

  // Update local JSON when selected entity changes
  React.useEffect(() => {
    if (selectedEntity) {
      // Strip internal properties if needed, or just show everything
      const { id, type, position, ...rest } = selectedEntity;
      setLocalJson(JSON.stringify(rest, null, 2));
      setJsonError(null);
    } else {
      setLocalJson('');
    }
  }, [selectedEntity?.id]);

  const handleJsonSave = () => {
    if (!selectedEntity) return;
    try {
      const updates = JSON.parse(localJson);
      onUpdateEntity(selectedEntity.id, updates);
      setJsonError(null);
      onDeselect(); // Hide editor on save
    } catch (e: any) {
      setJsonError(e.message);
    }
  };
  
  const updateState = (updates: Partial<EditorState>) => {
    onStateChange({ ...editorState, ...updates });
  };

  return (
    <div className="editor-panel">
      <div className="tool-section">
        <h4>Tools</h4>
        <div className="tool-buttons">
          <button 
            className={`tool-btn ${editorState.tool === 'select' ? 'active' : ''}`}
            onClick={() => updateState({ tool: 'select' })}
            title="Select/Move"
          >
            👆
          </button>
          <button 
            className={`tool-btn ${editorState.tool === 'place' ? 'active' : ''}`}
            onClick={() => updateState({ tool: 'place' })}
            title="Place Entity"
          >
            ➕
          </button>
          <button 
            className={`tool-btn ${editorState.tool === 'delete' ? 'active' : ''}`}
            onClick={() => updateState({ tool: 'delete' })}
            title="Delete Entity"
          >
            🗑️
          </button>
        </div>
      </div>

      {editorState.tool === 'place' && (
        <div className="place-section">
          <h4>Entity Type</h4>
          <div className="type-buttons">
            <button 
              className={`type-btn ${editorState.selectedType === 'npc' ? 'active' : ''}`}
              onClick={() => updateState({ selectedType: 'npc' })}
            >
              {ENTITY_ICONS.NPC} NPC
            </button>
            <button 
              className={`type-btn ${editorState.selectedType === 'resource' ? 'active' : ''}`}
              onClick={() => updateState({ selectedType: 'resource' })}
            >
              {ENTITY_ICONS.TREE} Resource
            </button>
            <button 
              className={`type-btn ${editorState.selectedType === 'building' ? 'active' : ''}`}
              onClick={() => updateState({ selectedType: 'building' })}
            >
              {ENTITY_ICONS.BUILDING} Building
            </button>
          </div>

          {editorState.selectedType === 'resource' && (
            <div className="options-section">
              <label>Resource Type:</label>
              <select 
                value={editorState.resourceType}
                onChange={(e) => updateState({ resourceType: e.target.value })}
              >
                <option value="oak_tree">Oak Tree</option>
                <option value="stone">Stone</option>
                <option value="bush_berry">Berry Bush</option>
                <option value="ore_iron">Iron Ore</option>
                <option value="ore_gold">Gold Ore</option>
                <option value="water_source">Water</option>
              </select>
            </div>
          )}

          {editorState.selectedType === 'building' && (
            <div className="options-section">
              <label>Building Type:</label>
              <select 
                value={editorState.buildingType}
                onChange={(e) => updateState({ buildingType: e.target.value })}
              >
                <option value="house_small">Small House</option>
                <option value="house_medium">Medium House</option>
                <option value="tavern">Tavern</option>
              </select>
            </div>
          )}
        </div>
      )}

      {editorState.tool === 'select' && selectedEntity && (
        <div className="edit-section">
          <h4>Edit Entity: {selectedEntity.id}</h4>
          <div className="json-editor">
            <label>Properties (JSON):</label>
            <textarea
              value={localJson}
              onChange={(e) => setLocalJson(e.target.value)}
              rows={10}
            />
            {jsonError && <div className="error-msg">{jsonError}</div>}
            <button className="save-btn" onClick={handleJsonSave}>
              💾 Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        {editorState.tool === 'select' && !selectedEntity && <p>Click entity to select & edit.</p>}
        {editorState.tool === 'select' && selectedEntity && <p>Edit properties above.</p>}
        {editorState.tool === 'place' && <p>Click on map to place {editorState.selectedType}.</p>}
        {editorState.tool === 'delete' && <p>Click entity to delete.</p>}
      </div>
    </div>
  );
};
