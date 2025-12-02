from typing import Dict, List, Optional, Tuple
import time
import heapq
from dataclasses import asdict

from .types import Goal, GoalType

class GoalManager:
    def __init__(self):
        # Priority queue for each NPC: {npc_id: [Goal, ...]}
        # We use a list and heapq to maintain priority
        self.goals: Dict[str, List[Goal]] = {}
        
        # Track active goal per NPC
        self.active_goals: Dict[str, str] = {}  # npc_id -> goal_id

    def add_goal(self, npc_id: str, goal: Goal):
        """Add a goal to the NPC's queue."""
        if npc_id not in self.goals:
            self.goals[npc_id] = []
            
        # Check if goal already exists (by ID)
        existing_idx = -1
        for i, g in enumerate(self.goals[npc_id]):
            if g.id == goal.id:
                existing_idx = i
                break
        
        if existing_idx >= 0:
            # Update existing goal if new priority is higher
            if goal.priority > self.goals[npc_id][existing_idx].priority:
                self.goals[npc_id][existing_idx] = goal
                # Re-heapify
                self._sort_goals(npc_id)
        else:
            # Add new goal
            self.goals[npc_id].append(goal)
            self._sort_goals(npc_id)

    def get_next_goal(self, npc_id: str) -> Optional[Goal]:
        """Get the highest priority goal for the NPC."""
        if npc_id not in self.goals or not self.goals[npc_id]:
            return None
            
        # Return highest priority (first in sorted list)
        return self.goals[npc_id][0]

    def complete_goal(self, npc_id: str, goal_id: str):
        """Mark a goal as complete and remove it."""
        if npc_id in self.goals:
            self.goals[npc_id] = [g for g in self.goals[npc_id] if g.id != goal_id]
            if npc_id in self.active_goals and self.active_goals[npc_id] == goal_id:
                del self.active_goals[npc_id]

    def abandon_goal(self, npc_id: str, goal_id: str, reason: str):
        """Abandon a goal (remove it)."""
        # For now, same as complete but we might want to log the reason
        print(f"Goal {goal_id} abandoned by {npc_id}: {reason}")
        self.complete_goal(npc_id, goal_id)

    def _sort_goals(self, npc_id: str):
        """Sort goals by priority (descending)."""
        # Python's sort is stable. We want high priority first.
        self.goals[npc_id].sort(key=lambda g: g.priority, reverse=True)
