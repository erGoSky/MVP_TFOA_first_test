import React, { useState } from 'react';
import type { WorldState, Entity } from '../../types/world';
import { PinnedCard } from './PinnedCard';
import './Sidebar.scss';

interface SidebarProps {
  worldState: WorldState | null;
  pinnedEntities: Map<string, Entity>;
  onUnpin: (id: string) => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ worldState, pinnedEntities, onUnpin, onClose }) => {
  const [collapsed, setCollapsed] = useState({
    info: false,
    legend: false
  });

  if (!worldState) return null;

  const toggleSection = (section: 'info' | 'legend') => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const npcCount = Object.keys(worldState.npcs).length;
  const resourceCount = Object.keys(worldState.resources).length;
  const buildingCount = Object.keys(worldState.buildings).length;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>World Data</h3>
        <button className="close-btn" onClick={onClose} title="Hide Sidebar">✕</button>
      </div>

      <div className={`info-panel ${collapsed.info ? 'collapsed' : ''}`}>
        <div className="info-title" onClick={() => toggleSection('info')}>
          <span>World Info</span>
          <span className="toggle-icon">{collapsed.info ? '▼' : '▲'}</span>
        </div>
        {!collapsed.info && (
          <>
            <div className="stat-row">
              <span>Grid Size:</span>
              <span>100 x 100</span>
            </div>
            <div className="stat-row">
              <span>Cell Size:</span>
              <span>16px</span>
            </div>
            <div className="stat-row">
              <span>Tick:</span>
              <span>{worldState.tick}</span>
            </div>
            <div className="stat-row">
              <span>NPCs:</span>
              <span>{npcCount}</span>
            </div>
            <div className="stat-row">
              <span>Resources:</span>
              <span>{resourceCount}</span>
            </div>
            <div className="stat-row">
              <span>Buildings:</span>
              <span>{buildingCount}</span>
            </div>
          </>
        )}
      </div>

      <div className={`info-panel ${collapsed.legend ? 'collapsed' : ''}`}>
        <div className="info-title" onClick={() => toggleSection('legend')}>
          <span>Legend</span>
          <span className="toggle-icon">{collapsed.legend ? '▼' : '▲'}</span>
        </div>
        {!collapsed.legend && (
          <div className="legend">
            <div className="legend-item">
              <div className="legend-icon">👨‍🌾</div>
              <div>NPCs</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon">🏛️</div>
              <div>Buildings</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon">🪵</div>
              <div>Wood</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon">⛰️</div>
              <div>Stone/Ore</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon">🌾</div>
              <div>Food</div>
            </div>
          </div>
        )}
      </div>

      <div className="pinned-cards-container">
        {Array.from(pinnedEntities.values()).map(entity => (
          <PinnedCard 
            key={entity.id} 
            entity={entity} 
            onUnpin={onUnpin} 
          />
        ))}
      </div>
    </div>
  );
};
