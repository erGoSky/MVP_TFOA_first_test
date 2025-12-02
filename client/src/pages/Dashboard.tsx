import React, { useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { NPCGrid } from "../components/dashboard/NPCGrid";
import { SaveLoadControls } from "../components/SaveLoadControls";
import { WorldControls } from "../components/dashboard/WorldControls";
import type { AppContextType } from "../components/layout/AppLayout";
import "./Dashboard.scss";

export const Dashboard: React.FC = () => {
  const { worldState, loading, error, centerOnEntity } = useOutletContext<AppContextType>();
  const saveLoadRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for save/load
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        // Trigger save dialog
        const saveBtn = saveLoadRef.current?.querySelector(".save-btn") as HTMLButtonElement;
        saveBtn?.click();
      } else if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        // Trigger load dialog
        const loadBtn = saveLoadRef.current?.querySelector(".load-btn") as HTMLButtonElement;
        loadBtn?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <div style={{ color: "#ff6b6b" }}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Simulation Dashboard</h1>
        <div className="save-load-container" ref={saveLoadRef}>
          <SaveLoadControls
            onSave={() => console.log("World saved")}
            onLoad={() => window.location.reload()}
          />
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <WorldControls />
        </div>

        <div className="dashboard-main">
          {worldState && (
            <NPCGrid
              npcs={worldState.npcs}
              onNPCClick={(npc) => centerOnEntity({ ...npc, type: "npc" })}
            />
          )}
        </div>
      </div>
    </div>
  );
};
