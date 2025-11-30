import React, { useState } from 'react';
import type { Entity } from '../../types/world';
import { EntityCard } from './EntityCard';
import { getEntitySymbol } from '../../utils/entityUtils';
import './BaseEntityCard.scss';

interface BaseEntityCardProps {
  entity: Entity;
  variant: 'hover' | 'pinned';
  onUnpin?: (id: string) => void;
}

export const BaseEntityCard: React.FC<BaseEntityCardProps> = ({ 
  entity, 
  variant,
  onUnpin 
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const getEntityName = () => {
    if (entity.type === 'npc') return (entity as any).name;
    if (entity.type === 'resource') return (entity as any).resourceType;
    if (entity.type === 'building') return (entity as any).buildingType;
    return 'Unknown Entity';
  };

  const isPinned = variant === 'pinned';

  return (
    <div className={`base-entity-card ${variant} ${collapsed ? 'collapsed' : ''}`}>
      <div 
        className="base-card-header" 
        style={{ cursor: isPinned ? 'pointer' : 'default' }}
      >
        <div className="header-content">
          {isPinned && (
            <div className="toggle-icon"
              onClick={isPinned ? () => setCollapsed(!collapsed) : undefined}>{collapsed ? '▶' : '▼'}</div>
          )}
          <span className="entity-icon">{getEntitySymbol(entity)}</span>
          <span className="entity-name">{getEntityName()}</span>
        </div>
        {isPinned && onUnpin && (
          <button 
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin(entity.id);
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div className="base-card-content">
        <EntityCard entity={entity} showTitle={false} />
      </div>
    </div>
  );
};
