import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { WorldCanvas } from '../map/WorldCanvas';
import { HoverCard } from '../map/HoverCard';
import { useWorldState } from '../../hooks/useWorldState';
import { useEntityHover } from '../../hooks/useEntityHover';
import type { WorldState, Entity } from '../../types/world';
import './AppLayout.scss';

export type AppContextType = {
  worldState: WorldState | null;
  loading: boolean;
  error: Error | null;
  hoveredEntities: Entity[];
  hoverIndex: number;
  mousePos: { x: number; y: number } | null;
  handleHover: (entities: Entity[], x: number, y: number) => void;
  cycleHover: (direction: number) => void;
  centerOnEntity: (entity: Entity) => void;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  editorMode: boolean;
  toggleEditorMode: () => void;
  screenToWorld: (x: number, y: number) => { x: number; y: number };
};

export const AppLayout: React.FC = () => {
  const { worldState, loading, error } = useWorldState();
  const { hoveredEntities, hoverIndex, mousePos, handleHover, cycleHover } = useEntityHover();
  
  // Lifted canvas state
  const [transform, setTransform] = useState({ scale: 1, offset: { x: 0, y: 0 } });

  const centerOnEntity = (entity: Entity) => {
    const TILE_SIZE = 32;
    const x = entity.position.x * TILE_SIZE;
    const y = entity.position.y * TILE_SIZE;
    
    // Center logic: screenCenter - entityPos * scale
    const newOffsetX = window.innerWidth / 2 - x * transform.scale;
    const newOffsetY = window.innerHeight / 2 - y * transform.scale;

    setTransform(prev => ({
      ...prev,
      offset: { x: newOffsetX, y: newOffsetY }
    }));
  };

  const screenToWorld = (screenX: number, screenY: number) => {
    const TILE_SIZE = 32;
    // (screen - offset) / scale / tile_size
    const worldX = Math.floor((screenX - transform.offset.x) / transform.scale / TILE_SIZE);
    const worldY = Math.floor((screenY - transform.offset.y) / transform.scale / TILE_SIZE);
    return { x: worldX, y: worldY };
  };

  // Sidebar visibility state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const toggleSidebar = () => setSidebarVisible(prev => !prev);

  // Editor mode state
  const [editorMode, setEditorMode] = useState(false);
  const toggleEditorMode = () => setEditorMode(prev => !prev);

  const contextValue: AppContextType = {
    worldState,
    loading,
    error,
    hoveredEntities,
    hoverIndex,
    mousePos,
    handleHover,
    cycleHover,
    centerOnEntity,
    sidebarVisible,
    toggleSidebar,
    editorMode,
    toggleEditorMode,
    screenToWorld
  };

  return (
    <div className="app-layout">
      <WorldCanvas 
        worldState={worldState} 
        onHover={handleHover}
        transform={transform}
        onTransformChange={setTransform}
      />
      
      <Navigation 
        worldState={worldState} 
        sidebarVisible={sidebarVisible}
        onToggleSidebar={toggleSidebar}
      />
      
      <main className="content-container">
        <Outlet context={contextValue} />
      </main>

      <HoverCard 
        entities={hoveredEntities}
        currentIndex={hoverIndex}
        position={mousePos}
        onCycle={cycleHover}
      />
    </div>
  );
};
