import React, { useState } from "react";
import type { NPC } from "../../types/world";
import "./NPCCard.scss";
import PlanningDebugPanel from "../debug/PlanningDebugPanel";

interface NPCCardProps {
  npc: NPC;
  onClick?: () => void;
}

export const NPCCard: React.FC<NPCCardProps> = ({ npc, onClick }) => {
  const [showDebug, setShowDebug] = useState(false);
  const hunger = (1 - npc.needs.hunger) * 100;
  const energy = npc.needs.energy * 100;
  const health = npc.stats.health;

  return (
    <div className="npc-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="npc-header">
        <div className="npc-name">{npc.name}</div>
        <div className="npc-action">{npc.currentAction || "idle"}</div>
      </div>

      <div className="stat-group">
        <div className="stat-row">
          <div className="stat-label">🍖 Hunger: {hunger.toFixed(0)}%</div>
          <div className="stat-bar">
            <div className="stat-fill hunger" style={{ width: `${hunger}%` }}>
              {hunger.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-label">⚡ Energy: {energy.toFixed(0)}%</div>
          <div className="stat-bar">
            <div className="stat-fill energy" style={{ width: `${energy}%` }}>
              {energy.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-label">❤️ Health: {health}%</div>
          <div className="stat-bar">
            <div className="stat-fill health" style={{ width: `${health}%` }}>
              {health}%
            </div>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-row">
          <span className="info-label">💰 Money:</span>
          <span className="info-value">{npc.stats.money} gold</span>
        </div>

        <div className="info-row">
          <span className="info-label">📍 Position:</span>
          <span className="info-value">
            ({npc.position.x.toFixed(1)}, {npc.position.y.toFixed(1)})
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">🏠 Homes:</span>
          <span className="info-value">{npc.ownedBuildingIds?.length || 0}</span>
        </div>
      </div>

      <div className="skills-grid">
        <div className="skill-item">
          <div className="skill-name">⛏️ Gathering</div>
          <div className="skill-value">{npc.skills.gathering}</div>
        </div>
        <div className="skill-item">
          <div className="skill-name">🔨 Crafting</div>
          <div className="skill-value">{npc.skills.crafting}</div>
        </div>
        <div className="skill-item">
          <div className="skill-name">💼 Trading</div>
          <div className="skill-value">{npc.skills.trading}</div>
        </div>
      </div>

      <div className="inventory-section">
        <div className="inventory-title">🎒 Inventory ({npc.inventory.length} items)</div>
        <div className="inventory-items">
          {npc.inventory.length > 0 ? (
            npc.inventory.map((item, index) => (
              <div key={`${item.type}-${index}`} className="inventory-item">
                {item.type} x{item.quantity}
              </div>
            ))
          ) : (
            <div className="inventory-item empty">Empty</div>
          )}
        </div>
      </div>

      <div
        className="debug-section"
        style={{ marginTop: "10px", borderTop: "1px solid #eee", paddingTop: "10px" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDebug(!showDebug);
          }}
          style={{
            background: "none",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: "0.8rem",
            width: "100%",
          }}
        >
          {showDebug ? "Hide Debug Info" : "Show Debug Info"}
        </button>

        {showDebug && (
          <div onClick={(e) => e.stopPropagation()}>
            <PlanningDebugPanel npcId={npc.id} />
          </div>
        )}
      </div>
    </div>
  );
};
