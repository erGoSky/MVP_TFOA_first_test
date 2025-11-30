import React from 'react';
import type { Entity, NPC, Resource, Building } from '../../types/world';
import './EntityCard.scss';

interface EntityCardProps {
  entity: Entity;
  showTitle?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({ entity, showTitle = true }) => {
  const renderNPC = (npc: NPC) => {
    const hunger = (1 - npc.needs.hunger) * 100;
    const energy = npc.needs.energy * 100;
    const health = npc.stats.health;

    return (
      <>
        {showTitle && <div className="card-header-title">👤 {npc.name}</div>}
        <div className="card-section">
          <div className="card-label">Current Action:</div>
          <div className="card-value">{npc.currentAction || 'idle'}</div>
        </div>
        <div className="card-section">
          <div className="card-label">🍖 Hunger: {hunger.toFixed(0)}%</div>
          <div className="stat-bar">
            <div className="stat-fill hunger" style={{ width: `${hunger}%` }}>{hunger.toFixed(0)}%</div>
          </div>
          <div className="card-label">⚡ Energy: {energy.toFixed(0)}%</div>
          <div className="stat-bar">
            <div className="stat-fill energy" style={{ width: `${energy}%` }}>{energy.toFixed(0)}%</div>
          </div>
          <div className="card-label">❤️ Health: {health}%</div>
          <div className="stat-bar">
            <div className="stat-fill health" style={{ width: `${health}%` }}>{health}%</div>
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
        <div className="card-section">
          <div className="card-label">🎒 Inventory ({npc.inventory.length}):</div>
          <div className="inventory-items">
            {npc.inventory.length > 0 ? (
              npc.inventory.map((item, i) => (
                <div key={i} className="inventory-item">{item.type} x{item.quantity}</div>
              ))
            ) : (
              <div className="inventory-item empty">Empty</div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderResource = (resource: Resource) => (
    <>
      {showTitle && <div className="card-header-title">🌿 {resource.resourceType}</div>}
      <div className="card-section">
        <div className="card-label">Amount:</div>
        <div className="card-value">{resource.amount}</div>
      </div>
      <div className="card-section">
        <div className="card-label">Value:</div>
        <div className="card-value">{resource.properties.value} gold</div>
      </div>
      {resource.properties.edible && (
        <div className="card-section">
          <div className="card-value">🍎 Edible</div>
        </div>
      )}
    </>
  );

  const renderBuilding = (building: Building) => (
    <>
      {showTitle && <div className="card-header-title">🏠 {building.buildingType}</div>}
      <div className="card-section">
        <div className="card-label">Gold:</div>
        <div className="card-value">{building.gold}</div>
      </div>
      <div className="card-section">
        <div className="card-label">Inventory ({building.inventory.length}):</div>
        <div className="inventory-items">
          {building.inventory.length > 0 ? (
            building.inventory.map((item, i) => (
              <div key={i} className="inventory-item">{item.type} x{item.quantity}</div>
            ))
          ) : (
            <div className="inventory-item empty">Empty</div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="entity-card-content">
      {entity.type === 'npc' && renderNPC(entity as NPC)}
      {entity.type === 'resource' && renderResource(entity as Resource)}
      {entity.type === 'building' && renderBuilding(entity as Building)}
      
      <div className="card-section">
        <div className="card-label">📍 Position:</div>
        <div className="card-value">
          ({entity.position.x.toFixed(1)}, {entity.position.y.toFixed(1)})
        </div>
      </div>
    </div>
  );
};
