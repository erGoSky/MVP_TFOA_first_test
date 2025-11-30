import React from 'react';
import type { Entity } from '../../types/world';
import { BaseEntityCard } from './BaseEntityCard';
import './HoverCard.scss';

interface HoverCardProps {
  entities: Entity[];
  currentIndex: number;
  position: { x: number; y: number } | null;
  onCycle: (direction: number) => void;
}

export const HoverCard: React.FC<HoverCardProps> = ({ 
  entities, 
  currentIndex, 
  position,
  onCycle 
}) => {
  if (!entities || entities.length === 0 || !position) return null;

  const entity = entities[currentIndex];
  
  // Calculate position to keep card on screen
  // This is a simplified version; a robust solution would check window bounds
  const style: React.CSSProperties = {
    left: position.x + 15,
    top: position.y + 15,
  };

  return (
    <div className="hover-card" style={style}>
      {entities.length > 1 && (
        <div className="hover-card-nav">
          <button onClick={() => onCycle(-1)}>◀</button>
          <span>{currentIndex + 1} / {entities.length}</span>
          <button onClick={() => onCycle(1)}>▶</button>
        </div>
      )}
      <BaseEntityCard entity={entity} variant="hover" />
    </div>
  );
};
