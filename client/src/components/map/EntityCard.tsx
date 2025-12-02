import React from "react";
import type { Entity, NPC, Resource, Building } from "../../types/world";
import "./EntityCard.scss";

interface EntityCardProps {
  entity: Entity;
  showTitle?: boolean;
  compact?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  showTitle = true,
  compact = false,
}) => {
  const getActionBadge = (
    action: string | null
  ): { icon: string; label: string; color: string } => {
    if (!action) return { icon: "💤", label: "Idle", color: "#888" };

    const actionType = action.split(":")[0];
    const badges: Record<string, { icon: string; label: string; color: string }> = {
      move: { icon: "🚶", label: "Moving", color: "#4CAF50" },
      chop: { icon: "🪓", label: "Chopping", color: "#8B4513" },
      mine: { icon: "⛏️", label: "Mining", color: "#757575" },
      craft: { icon: "🔨", label: "Crafting", color: "#FF9800" },
      sleep: { icon: "😴", label: "Sleeping", color: "#3F51B5" },
      eat: { icon: "🍖", label: "Eating", color: "#E91E63" },
      work: { icon: "💼", label: "Working", color: "#009688" },
      sell: { icon: "💰", label: "Selling", color: "#FFC107" },
      buy: { icon: "🛒", label: "Buying", color: "#2196F3" },
    };

    return badges[actionType] || { icon: "❓", label: action, color: "#888" };
  };

  const renderNPC = (npc: NPC) => {
    const hunger = (1 - npc.needs.hunger) * 100;
    const energy = npc.needs.energy * 100;
    const health = npc.stats.health;
    const badge = getActionBadge(npc.currentAction);

    return (
      <>
        {showTitle && <div className="card-header-title">👤 {npc.name}</div>}
        <div className="card-section">
          <div className="card-label">Current Action:</div>
          <div className="card-value">
            <span className="status-badge" style={{ backgroundColor: badge.color }}>
              {badge.icon} {badge.label}
            </span>
          </div>
        </div>

        {!compact && (
          <>
            <div className="card-section">
              <div className="card-label">🍖 Hunger: {hunger.toFixed(0)}%</div>
              <div className="stat-bar">
                <div className="stat-fill hunger" style={{ width: `${hunger}%` }}>
                  {hunger.toFixed(0)}%
                </div>
              </div>
              <div className="card-label">⚡ Energy: {energy.toFixed(0)}%</div>
              <div className="stat-bar">
                <div className="stat-fill energy" style={{ width: `${energy}%` }}>
                  {energy.toFixed(0)}%
                </div>
              </div>
              <div className="card-label">❤️ Health: {health}%</div>
              <div className="stat-bar">
                <div className="stat-fill health" style={{ width: `${health}%` }}>
                  {health}%
                </div>
              </div>
            </div>
            <div className="card-section">
              <div className="card-label">💰 Money:</div>
              <div className="card-value">{npc.stats.money} gold</div>
            </div>
            <div className="card-section">
              <div className="card-label">⛏️ Skills:</div>
              <div className="card-value">
                G: {npc.skills.gathering} | C: {npc.skills.crafting} | T: {npc.skills.trading}
              </div>
            </div>
          </>
        )}

        <div className="card-section">
          <div className="card-label">🎒 Inventory ({npc.inventory.length}):</div>
          <div className="inventory-items">
            {npc.inventory.length > 0 ? (
              npc.inventory.slice(0, compact ? 4 : undefined).map((item, i) => {
                const durability = item.properties?.durability;
                const maxDurability = item.properties?.maxDurability;
                let durabilityPct = 0;
                let durabilityClass = "";

                if (durability !== undefined && maxDurability) {
                  durabilityPct = (durability / maxDurability) * 100;
                  if (durabilityPct < 30) durabilityClass = "low";
                  else if (durabilityPct < 70) durabilityClass = "medium";
                }

                return (
                  <div key={i} className="inventory-item">
                    <span>
                      {item.type} x{item.quantity}
                    </span>
                    {durability !== undefined && (
                      <div className="durability-bar">
                        <div
                          className={`fill ${durabilityClass}`}
                          style={{ width: `${durabilityPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="inventory-item empty">Empty</div>
            )}
            {compact && npc.inventory.length > 4 && (
              <div className="inventory-item">+{npc.inventory.length - 4} more</div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderResource = (resource: Resource) => {
    let statusColor = "#4CAF50"; // Green
    let statusLabel = "Abundant";

    if (resource.amount < 5) {
      statusColor = "#F44336"; // Red
      statusLabel = "Depleted";
    } else if (resource.amount < 10) {
      statusColor = "#FFC107"; // Amber
      statusLabel = "Low";
    }

    return (
      <>
        {showTitle && <div className="card-header-title">🌿 {resource.resourceType}</div>}
        <div className="card-section">
          <div className="card-label">Status:</div>
          <div className="card-value">
            <span className="status-badge" style={{ backgroundColor: statusColor }}>
              {statusLabel} ({resource.amount})
            </span>
          </div>
        </div>
        <div className="card-section">
          <div className="card-label">Value:</div>
          <div className="card-value">{resource.properties.value} gold</div>
        </div>
        {!compact && resource.properties.edible && (
          <div className="card-section">
            <div className="card-value">🍎 Edible</div>
          </div>
        )}
      </>
    );
  };

  const renderBuilding = (building: Building) => {
    const itemCount = building.inventory.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <>
        {showTitle && <div className="card-header-title">🏠 {building.buildingType}</div>}
        <div className="card-section">
          <div className="card-label">Status:</div>
          <div className="card-value">
            {itemCount > 0 ? (
              <span className="status-badge" style={{ backgroundColor: "#2196F3" }}>
                📦 {itemCount} Items Stored
              </span>
            ) : (
              <span className="status-badge" style={{ backgroundColor: "#9E9E9E" }}>
                Empty
              </span>
            )}
          </div>
        </div>
        {!compact && (
          <div className="card-section">
            <div className="card-label">Gold:</div>
            <div className="card-value">{building.gold}</div>
          </div>
        )}
        <div className="card-section">
          <div className="card-label">Inventory ({building.inventory.length} slots):</div>
          <div className="inventory-items">
            {building.inventory.length > 0 ? (
              building.inventory.slice(0, compact ? 4 : undefined).map((item, i) => (
                <div key={i} className="inventory-item">
                  {item.type} x{item.quantity}
                </div>
              ))
            ) : (
              <div className="inventory-item empty">Empty</div>
            )}
            {compact && building.inventory.length > 4 && (
              <div className="inventory-item">+{building.inventory.length - 4} more</div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="entity-card-content">
      {entity.type === "npc" && renderNPC(entity as NPC)}
      {entity.type === "resource" && renderResource(entity as Resource)}
      {entity.type === "building" && renderBuilding(entity as Building)}

      {!compact && (
        <div className="card-section">
          <div className="card-label">📍 Position:</div>
          <div className="card-value">
            ({entity.position.x.toFixed(1)}, {entity.position.y.toFixed(1)})
          </div>
        </div>
      )}
    </div>
  );
};
