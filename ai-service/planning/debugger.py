from typing import Dict, List, Any, Optional
from collections import deque
import time
from dataclasses import asdict

from .types import Goal

class PlanningDebugger:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PlanningDebugger, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        # Store last N plans per NPC
        self.history_size = 20
        self.plan_history: Dict[str, deque] = {}
        
        # Store active goals per NPC for quick access
        self.active_goals: Dict[str, List[Dict]] = {}
        
        # System-wide metrics
        self.metrics = {
            "total_plans": 0,
            "successful_plans": 0,
            "failed_plans": 0,
            "avg_planning_time_ms": 0,
            "goal_types": {}
        }
        
        self._initialized = True

    def record_plan(self, npc_id: str, goal: Goal, plan: Optional[List[str]], 
                   duration_ms: float, success: bool, error: str = None):
        """Record a planning attempt."""
        if npc_id not in self.plan_history:
            self.plan_history[npc_id] = deque(maxlen=self.history_size)
            
        entry = {
            "timestamp": int(time.time() * 1000),
            "goal": asdict(goal),
            "plan": plan,
            "success": success,
            "duration_ms": duration_ms,
            "error": error
        }
        
        self.plan_history[npc_id].appendleft(entry)
        
        # Update metrics
        self.metrics["total_plans"] += 1
        if success:
            self.metrics["successful_plans"] += 1
        else:
            self.metrics["failed_plans"] += 1
            
        # Update average time (moving average)
        alpha = 0.1
        current_avg = self.metrics["avg_planning_time_ms"]
        self.metrics["avg_planning_time_ms"] = (current_avg * (1 - alpha)) + (duration_ms * alpha)
        
        # Track goal types
        g_type = goal.type.value
        self.metrics["goal_types"][g_type] = self.metrics["goal_types"].get(g_type, 0) + 1

    def update_goals(self, npc_id: str, goals: List[Goal]):
        """Update the current goal queue for an NPC."""
        self.active_goals[npc_id] = [asdict(g) for g in goals]

    def get_history(self, npc_id: str) -> List[Dict]:
        """Get planning history for an NPC."""
        if npc_id in self.plan_history:
            return list(self.plan_history[npc_id])
        return []

    def get_active_goals(self, npc_id: str) -> List[Dict]:
        """Get active goals for an NPC."""
        return self.active_goals.get(npc_id, [])

    def get_stats(self) -> Dict:
        """Get system-wide planning statistics."""
        return self.metrics
