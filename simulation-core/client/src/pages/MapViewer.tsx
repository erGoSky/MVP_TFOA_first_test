import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sidebar } from '../components/map/Sidebar';
import { SaveLoadControls } from '../components/SaveLoadControls';
import type { Entity } from '../types/world';
import type { AppContextType } from '../components/layout/AppLayout';
import './MapViewer.scss';

export const MapViewer: React.FC = () => {
  const { worldState, loading, error, hoveredEntities, hoverIndex, sidebarVisible, toggleSidebar } = useOutletContext<AppContextType>();
  
  // Local state for pinned entities
  const [pinnedEntities, setPinnedEntities] = useState<Map<string, Entity>>(new Map());
  const saveLoadRef = useRef<HTMLDivElement>(null);

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

  // Handle click on canvas (via global event or passed down handler if needed)
  // Since canvas is now global, we might need a way to intercept clicks for pinning
  // For now, let's assume we can pin via hover card or sidebar, or we need to add a global click handler in AppLayout that calls a callback here?
  // Actually, AppLayout handles the canvas. If we want to pin on click, AppLayout needs to know about this.
  // OR, we can use the fact that we have hoveredEntities from context.
  // If we click anywhere and there are hovered entities, we can pin them.
  // But the click listener is on the canvas in AppLayout.
  
  // Let's add a global click handler effect here that listens to the window/document
  // and checks if we are hovering something.
  // Keyboard shortcuts for save/load
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Trigger save dialog
        const saveBtn = saveLoadRef.current?.querySelector('.save-btn') as HTMLButtonElement;
        saveBtn?.click();
      } else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        // Trigger load dialog
        const loadBtn = saveLoadRef.current?.querySelector('.load-btn') as HTMLButtonElement;
        loadBtn?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (hoveredEntities.length > 0) {
        handleEntityClick(hoveredEntities[hoverIndex]);
      }
    };

    // We only want this to happen when clicking the canvas, which is the background.
    // But the canvas is in AppLayout. 
    // A simple way is to listen to 'click' on window, but check if target is canvas?
    // Or just listen to click.
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [hoveredEntities, hoverIndex]);


  const handleUnpin = (id: string) => {
    setPinnedEntities(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  if (loading && !worldState) {
    return <div className="loading-screen">Loading simulation...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error.message}</div>;
  }

  return (
    <div className="map-viewer-page">
      <div className="save-load-container" ref={saveLoadRef}>
        <SaveLoadControls 
          onSave={() => console.log('World saved')}
          onLoad={() => window.location.reload()} // Refresh to load new state
        />
      </div>
      {sidebarVisible && (
        <Sidebar 
          worldState={worldState}
          pinnedEntities={pinnedEntities}
          onUnpin={handleUnpin}
          onClose={toggleSidebar}
        />
      )}
    </div>
  );
};
