import React from "react";
import { useSimulation } from "../../hooks/useSimulation";
import "./SimulationControls.scss";

export const SimulationControls: React.FC = () => {
  const { status, play, pause, setSpeed } = useSimulation();

  return (
    <div className="simulation-controls">
      <div className="control-panel-title">⚙️ Simulation Control</div>

      <div className="control-buttons">
        <button
          className={`control-btn ${!status.paused ? "active" : ""}`}
          onClick={play}
          disabled={!status.paused}
        >
          ▶️ Play
        </button>
        <button
          className={`control-btn pause-btn ${status.paused ? "active" : ""}`}
          onClick={pause}
          disabled={status.paused}
        >
          ⏸️ Pause
        </button>
      </div>

      <div className="speed-buttons">
        {[1, 2, 4, 8, 16].map((speed) => (
          <button
            key={speed}
            className={`speed-btn ${status.speed === speed ? "active" : ""}`}
            onClick={() => setSpeed(speed)}
          >
            x{speed}
          </button>
        ))}
      </div>
    </div>
  );
};
