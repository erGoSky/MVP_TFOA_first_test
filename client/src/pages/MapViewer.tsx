import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sidebar } from '../components/map/Sidebar';
import type { EditorState } from '../components/editor/EditorPanel';
import type { Entity } from '../types/world';
import type { AppContextType } from '../components/layout/AppLayout';
import './MapViewer.scss';

export const MapViewer: React.FC = () => {
  const { 
    worldState, 
    loading, 
    error, 
    hoveredEntities, 
    hoverIndex, 
    sidebarVisible, 
    toggleSidebar,
    editorMode,
    toggleEditorMode,
    screenToWorld
  } = useOutletContext<AppContextType>();
  
  // Local state for pinned entities
  const [pinnedEntities, setPinnedEntities] = useState<Map<string, Entity>>(new Map());

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    tool: 'select',
    selectedType: 'npc',
    resourceType: 'oak_tree',
    buildingType: 'house_small',
    npcArchetype: 'villager'
  });

  // Editor selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Update pinned entities when world state changes
  useEffect(() => {
    if (!worldState) return;

    setPinnedEntities(prev => {
      const next = new Map(prev);
      let changed = false;

      for (const [id, entity] of prev) {
        let updatedEntity: Entity | undefined;
        
        if (entity.type === 'npc') updatedEntity = worldState.npcs[id];
        else if (entity.type === 'building') updatedEntity = worldState.buildings[id];
        else if (entity.type === 'resource') updatedEntity = worldState.resources[id];

        if (updatedEntity) {
          next.set(id, { ...updatedEntity, type: entity.type });
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [worldState]);

  const handleEntityClick = (entity: Entity) => {
    console.log('handleEntityClick', entity);
    setPinnedEntities(prev => {
      const next = new Map(prev);
      if (next.has(entity.id)) {
        next.delete(entity.id);
      } else {
        next.set(entity.id, entity);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      // Ignore clicks on UI elements
      if ((e.target as HTMLElement).closest('.sidebar') || 
          (e.target as HTMLElement).closest('.save-load-container')) {
        return;
      }

      if (editorMode) {
        const worldPos = screenToWorld(e.clientX, e.clientY);

        if (editorState.tool === 'place') {
          const id = `${editorState.selectedType}_${Date.now()}`;
          let body: any = {
            type: editorState.selectedType,
            id,
            position: worldPos
          };

          if (editorState.selectedType === 'npc') {
            body.name = 'New NPC';
            body.skills = { gathering: 10, crafting: 10, trading: 10 };
            body.archetype = editorState.npcArchetype;
          } else if (editorState.selectedType === 'resource') {
            body.resourceType = editorState.resourceType;
            body.amount = 10;
            body.properties = { value: 1 }; 
          } else if (editorState.selectedType === 'building') {
            body.buildingType = editorState.buildingType;
          }

          try {
            await fetch('/entity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } catch (err) {
            console.error('Failed to create entity:', err);
          }
        } else if (editorState.tool === 'delete') {
          if (hoveredEntities.length > 0) {
            const entity = hoveredEntities[hoverIndex];
            try {
              await fetch(`/entity/${entity.id}`, { method: 'DELETE' });
            } catch (err) {
              console.error('Failed to delete entity:', err);
            }
          }
        } else if (editorState.tool === 'select') {
          if (hoveredEntities.length > 0) {
            setSelectedEntityId(hoveredEntities[hoverIndex].id);
          } else {
            setSelectedEntityId(null);
          }
        }
      } else {
        // Normal mode: Pin entities
        if (hoveredEntities.length > 0) {
          handleEntityClick(hoveredEntities[hoverIndex]);
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [hoveredEntities, hoverIndex, editorMode, editorState, screenToWorld]);


  const handleUnpin = (id: string) => {
    setPinnedEntities(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleUpdateEntity = async (id: string, updates: Partial<Entity>) => {
    try {
      await fetch(`/entity/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Failed to update entity:', err);
    }
  };

  // Get selected entity object
  let selectedEntity: Entity | null = null;
  if (selectedEntityId && worldState) {
    if (worldState.npcs[selectedEntityId]) selectedEntity = { ...worldState.npcs[selectedEntityId], type: 'npc' };
    else if (worldState.resources[selectedEntityId]) selectedEntity = { ...worldState.resources[selectedEntityId], type: 'resource' };
    else if (worldState.buildings[selectedEntityId]) selectedEntity = { ...worldState.buildings[selectedEntityId], type: 'building' };
  }

  const handleDeselect = () => {
    setSelectedEntityId(null);
  };

  if (loading && !worldState) {
    return <div className="loading-screen">Loading simulation...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error.message}</div>;
  }

  return (
    <div className="map-viewer-page">
      {sidebarVisible && (
        <Sidebar 
          worldState={worldState}
          pinnedEntities={pinnedEntities}
          onUnpin={handleUnpin}
          onClose={toggleSidebar}
          editorMode={editorMode}
          toggleEditorMode={toggleEditorMode}
          editorState={editorState}
          onEditorStateChange={setEditorState}
          selectedEntity={selectedEntity}
          onUpdateEntity={handleUpdateEntity}
          onDeselect={handleDeselect}
        />
      )}
    </div>
  );
};
