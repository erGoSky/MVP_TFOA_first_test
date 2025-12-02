import React, { useState, useEffect } from "react";
import "./SaveLoadControls.scss";

interface SaveLoadControlsProps {
  onSave?: () => void;
  onLoad?: () => void;
}

export const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({ onSave, onLoad }) => {
  const [saves, setSaves] = useState<string[]>([]);
  const [selectedSave, setSelectedSave] = useState<string>("");
  const [newSaveName, setNewSaveName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDialog, setShowDialog] = useState<"save" | "load" | null>(null);

  useEffect(() => {
    loadSavesList();
  }, []);

  const loadSavesList = async () => {
    try {
      const response = await fetch("/saves");
      const data = await response.json();
      setSaves(data.saves || []);
    } catch (error) {
      console.error("Failed to load saves list:", error);
    }
  };

  const handleSave = async () => {
    if (!newSaveName.trim()) {
      showMessage("error", "Please enter a save name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: newSaveName }),
      });

      const data = await response.json();
      if (response.ok) {
        showMessage("success", data.message);
        setNewSaveName("");
        setShowDialog(null);
        loadSavesList();
        onSave?.();
      } else {
        showMessage("error", data.error);
      }
    } catch (error: any) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedSave) {
      showMessage("error", "Please select a save to load");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedSave }),
      });

      const data = await response.json();
      if (response.ok) {
        showMessage("success", data.message);
        setShowDialog(null);
        onLoad?.();
      } else {
        showMessage("error", data.error);
      }
    } catch (error: any) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete save "${filename}"?`)) return;

    try {
      const response = await fetch(`/save/${filename}`, { method: "DELETE" });
      const data = await response.json();
      if (response.ok) {
        showMessage("success", data.message);
        loadSavesList();
        if (selectedSave === filename) setSelectedSave("");
      } else {
        showMessage("error", data.error);
      }
    } catch (error: any) {
      showMessage("error", error.message);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="save-load-controls">
      <button
        className="control-btn save-btn"
        onClick={() => setShowDialog("save")}
        title="Save World (Ctrl+S)"
      >
        💾 Save
      </button>
      <button
        className="control-btn load-btn"
        onClick={() => setShowDialog("load")}
        title="Load World (Ctrl+L)"
      >
        📂 Load
      </button>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {showDialog === "save" && (
        <div className="dialog-overlay" onClick={() => setShowDialog(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Save World</h3>
              <button className="close-btn" onClick={() => setShowDialog(null)}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <input
                type="text"
                placeholder="Enter save name..."
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <div className="existing-saves">
                <h4>Existing Saves:</h4>
                {saves.length === 0 ? (
                  <p className="no-saves">No saves yet</p>
                ) : (
                  <ul>
                    {saves.map((save) => (
                      <li key={save}>
                        <span>{save}</span>
                        <button onClick={() => handleDelete(save)} className="delete-btn">
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowDialog(null)} disabled={loading}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !newSaveName.trim()}
                className="primary"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDialog === "load" && (
        <div className="dialog-overlay" onClick={() => setShowDialog(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Load World</h3>
              <button className="close-btn" onClick={() => setShowDialog(null)}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              {saves.length === 0 ? (
                <p className="no-saves">No saves available</p>
              ) : (
                <div className="save-list">
                  {saves.map((save) => (
                    <div
                      key={save}
                      className={`save-item ${selectedSave === save ? "selected" : ""}`}
                      onClick={() => setSelectedSave(save)}
                    >
                      <span>📄 {save}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(save);
                        }}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowDialog(null)} disabled={loading}>
                Cancel
              </button>
              <button onClick={handleLoad} disabled={loading || !selectedSave} className="primary">
                {loading ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
