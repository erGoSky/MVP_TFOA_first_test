import React, { useEffect, useState } from "react";
import axios from "axios";

const AI_SERVICE_URL = "http://localhost:8000";

interface Goal {
  id: string;
  type: string;
  priority: number;
}

interface PlanEntry {
  timestamp: string;
  goal: string;
  plan: string[];
  success: boolean;
  duration: number;
  error?: string;
}

interface PlanningDebugPanelProps {
  npcId: string;
}

const PlanningDebugPanel: React.FC<PlanningDebugPanelProps> = ({ npcId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [planHistory, setPlanHistory] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, historyRes] = await Promise.all([
          axios.get(`${AI_SERVICE_URL}/debug/npc/${npcId}/goals`),
          axios.get(`${AI_SERVICE_URL}/debug/npc/${npcId}/planning`),
        ]);

        setGoals(goalsRes.data.goals || []);
        setPlanHistory(historyRes.data.history || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch debug data:", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [npcId]);

  if (loading) {
    return <div className="debug-panel">Loading debug data...</div>;
  }

  return (
    <div className="debug-panel">
      <div className="debug-section">
        <h3>Active Goals Queue</h3>
        {goals.length === 0 ? (
          <p className="empty-state">No active goals</p>
        ) : (
          <ul className="goals-list">
            {goals.map((goal) => (
              <li key={goal.id} className="goal-item">
                <span className="goal-type">{goal.type}</span>
                <span className="goal-priority">Priority: {goal.priority.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="debug-section">
        <h3>Recent Plans</h3>
        {planHistory.length === 0 ? (
          <p className="empty-state">No planning history</p>
        ) : (
          <ul className="plan-history">
            {planHistory.slice(0, 5).map((entry, idx) => (
              <li key={idx} className={`plan-entry ${entry.success ? 'success' : 'failed'}`}>
                <div className="plan-header">
                  <span className={`status-badge ${entry.success ? 'success' : 'failed'}`}>
                    {entry.success ? '✓' : '✗'}
                  </span>
                  <span className="plan-goal">{entry.goal}</span>
                  <span className="plan-duration">{entry.duration.toFixed(0)}ms</span>
                </div>
                {entry.success && entry.plan && (
                  <div className="plan-steps">
                    {entry.plan.map((step, i) => (
                      <span key={i} className="plan-step">{step}</span>
                    ))}
                  </div>
                )}
                {!entry.success && entry.error && (
                  <div className="plan-error">{entry.error}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .debug-panel {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          color: #e0e0e0;
        }

        .debug-section {
          margin-bottom: 24px;
        }

        .debug-section h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #4fc3f7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .empty-state {
          color: #666;
          font-style: italic;
          font-size: 13px;
        }

        .goals-list, .plan-history {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .goal-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #2a2a2a;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .goal-type {
          font-weight: 500;
          color: #81c784;
        }

        .goal-priority {
          color: #ffb74d;
          font-size: 12px;
        }

        .plan-entry {
          padding: 12px;
          background: #2a2a2a;
          border-radius: 4px;
          margin-bottom: 8px;
          border-left: 3px solid transparent;
        }

        .plan-entry.success {
          border-left-color: #4caf50;
        }

        .plan-entry.failed {
          border-left-color: #f44336;
        }

        .plan-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .status-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .status-badge.success {
          background: #4caf50;
          color: white;
        }

        .status-badge.failed {
          background: #f44336;
          color: white;
        }

        .plan-goal {
          flex: 1;
          font-weight: 500;
        }

        .plan-duration {
          color: #999;
          font-size: 12px;
        }

        .plan-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .plan-step {
          background: #3a3a3a;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          color: #90caf9;
        }

        .plan-error {
          color: #ef5350;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default PlanningDebugPanel;
