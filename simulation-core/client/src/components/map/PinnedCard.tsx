import React from 'react';
import type { Entity } from '../../types/world';
import { BaseEntityCard } from './BaseEntityCard';
import './PinnedCard.scss';

interface PinnedCardProps {
  entity: Entity;
  onUnpin: (id: string) => void;
}

export const PinnedCard: React.FC<PinnedCardProps> = ({ entity, onUnpin }) => {
  return (
    <div className="pinned-card-wrapper">
      <BaseEntityCard entity={entity} variant="pinned" onUnpin={onUnpin} />
    </div>
  );
};
