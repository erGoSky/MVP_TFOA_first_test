import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { NPCGrid } from '../components/dashboard/NPCGrid';
import type { AppContextType } from '../components/layout/AppLayout';
import './Dashboard.scss';

export const Dashboard: React.FC = () => {
  const { worldState, loading, error, centerOnEntity } = useOutletContext<AppContextType>();

  if (loading && !worldState) {
    return (
      <div className="container">
        <div className="updating">Loading simulation state...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ color: '#ff6b6b' }}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {worldState && (
        <NPCGrid 
          npcs={worldState.npcs} 
          onNPCClick={(npc) => centerOnEntity({ ...npc, type: 'npc' })}
        />
      )}
    </div>
  );
};
