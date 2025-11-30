import React from 'react';
import type { NPC } from '../../types/world';
import { NPCCard } from './NPCCard';
import './NPCGrid.scss';

interface NPCGridProps {
  npcs: Record<string, NPC>;
  onNPCClick?: (npc: NPC) => void;
}

export const NPCGrid: React.FC<NPCGridProps> = ({ npcs, onNPCClick }) => {
  const npcList = Object.values(npcs);

  if (npcList.length === 0) {
    return <div className="npc-grid-empty">No NPCs found in the world.</div>;
  }

  return (
    <div className="npc-grid">
      {npcList.map(npc => (
        <NPCCard 
          key={npc.id} 
          npc={npc} 
          onClick={() => onNPCClick?.(npc)}
        />
      ))}
    </div>
  );
};
