import React, { useState } from "react";
import "./WorldControls.scss";

export const WorldControls: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGenerate = async () => {
    if (!confirm("Are you sure? This will overwrite the current world.")) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/world/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapSize: 100,
          npcCount: 5,
          resourceDensity: 0.5,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage({ type: "success", text: "World generated successfully!" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure? This will clear everything.")) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/world/reset", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());

      setMessage({ type: "success", text: "World reset successfully!" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="world-controls">
      <h3>World Management</h3>
      <div className="controls-group">
        <button className="control-btn generate-btn" onClick={handleGenerate} disabled={loading}>
          🌍 Generate New World
        </button>
        <button className="control-btn reset-btn" onClick={handleReset} disabled={loading}>
          🗑️ Reset World
        </button>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </div>
  );
};
