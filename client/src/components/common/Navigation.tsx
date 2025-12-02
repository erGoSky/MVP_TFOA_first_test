import React from "react";
import { NavLink } from "react-router-dom";
import { SimulationControls } from "../map/SimulationControls";
import type { WorldState } from "../../types/world";
import { StatsHeader } from "../dashboard/StatsHeader";
import "./Navigation.scss";

interface NavigationProps {
  worldState: WorldState | null;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  worldState,
  sidebarVisible,
  onToggleSidebar,
}) => {
  return (
    <nav className="navigation">
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          🗺️ Map
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          📊 Dashboard
        </NavLink>

        {!sidebarVisible && (
          <button className="nav-btn" onClick={onToggleSidebar} title="Show World Info">
            ℹ️ Show Info
          </button>
        )}
      </div>

      <StatsHeader worldState={worldState} />

      <div className="nav-controls">
        <SimulationControls />
      </div>
    </nav>
  );
};
