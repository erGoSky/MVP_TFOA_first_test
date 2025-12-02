import React from "react";
import type { WorldState } from "../../types/world";
import "./StatsHeader.scss";

interface StatsHeaderProps {
  worldState: WorldState | null;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ worldState }) => {
  if (!worldState) return null;

  const npcCount = Object.keys(worldState.npcs).length;
  const resourceCount = Object.keys(worldState.resources).length;
  const buildingCount = Object.keys(worldState.buildings).length;

  return (
    <div className="stats-header">
      <div className="stats-bar">
        <div className="stat-item">
          <span className="label">Tick:</span>
          <strong className="value">{worldState.tick}</strong>
        </div>
        <div className="stat-item">
          <span className="label">Time:</span>
          <strong className="value">{worldState.time}</strong>
        </div>
        <div className="stat-item">
          <span className="label">NPCs:</span>
          <strong className="value">{npcCount}</strong>
        </div>
        <div className="stat-item">
          <span className="label">Resources:</span>
          <strong className="value">{resourceCount}</strong>
        </div>
        <div className="stat-item">
          <span className="label">Buildings:</span>
          <strong className="value">{buildingCount}</strong>
        </div>
      </div>
    </div>
  );
};
