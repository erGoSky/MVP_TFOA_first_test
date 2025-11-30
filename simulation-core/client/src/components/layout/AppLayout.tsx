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
  mousePos: { x: number; y: number };
  handleHover: (entities: Entity[], x: number, y: number) => void;
  cycleHover: () => void;
  centerOnEntity: (entity: Entity) => void;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
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

  // Sidebar visibility state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const toggleSidebar = () => setSidebarVisible(prev => !prev);

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
    toggleSidebar
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
