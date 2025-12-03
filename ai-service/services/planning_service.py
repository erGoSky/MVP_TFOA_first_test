import time
from typing import Dict, List, Optional

from planning.action_registry import registry as action_registry
from planning.debugger import debugger
from planning.types import Goal, GoalType


class PlanningService:
    """Service for NPC action planning using GOAP."""

    def __init__(self):
        self.action_registry = action_registry

    def plan_actions(
        self, npc_id: str, goal: Goal, world_state: Dict, npc_state: Dict
    ) -> Optional[List[str]]:
        """
        Generate a plan to achieve the given goal.

        Args:
            npc_id: ID of the NPC
            goal: The goal to achieve
            world_state: Current world state
            npc_state: Current NPC state

        Returns:
            List of action IDs representing the plan, or None if no plan found
        """
        start_time = time.time()

        try:
            # Simple planning: just return the first action that matches the goal
            # In a real GOAP system, this would do A* search through action space
            plan = self._simple_plan(goal, world_state, npc_state)

            duration_ms = (time.time() - start_time) * 1000
            debugger.record_plan(
                npc_id=npc_id,
                goal=goal,
                plan=plan,
                duration_ms=duration_ms,
                success=plan is not None,
            )

            return plan

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            debugger.record_plan(
                npc_id=npc_id,
                goal=goal,
                plan=None,
                duration_ms=duration_ms,
                success=False,
                error=str(e),
            )
            return None

    def _simple_plan(self, goal: Goal, world_state: Dict, npc_state: Dict) -> Optional[List[str]]:
        """Simple planning logic - maps goals to actions."""
        goal_to_action = {
            GoalType.GATHER_FOOD: "gather_food",
            GoalType.GATHER_WOOD: "gather_wood",
            GoalType.GATHER_STONE: "gather_stone",
            GoalType.GATHER_IRON: "gather_iron",
            GoalType.EXPLORE: "explore",
            GoalType.BUILD_SHELTER: "build_shelter",
            GoalType.CRAFT_TOOL: "craft_tool",
        }

        action_id = goal_to_action.get(goal.type)
        if action_id and action_id in self.action_registry.actions:
            return [action_id]

        return None

    def plan_action_enhanced(self, data):
        """
        Enhanced planning endpoint that accepts structured request data.

        Args:
            data: EnhancedPlanRequest with npc_state, goal, and world_state

        Returns:
            Dict with plan and metadata
        """
        # Extract data from request
        npc_id = data.npc_state.get("id", "unknown")
        goal_data = data.goal

        # Convert goal dict to Goal object
        goal_type = GoalType(goal_data.get("type", "explore"))

        # Create goal with required parameters
        goal = Goal(
            id=goal_data.get("id", f"goal_{npc_id}_{int(time.time())}"),
            type=goal_type,
            priority=goal_data.get("priority", 1.0),
            conditions=goal_data.get("conditions", []),
            is_global=goal_data.get("is_global", False),
            deadline=goal_data.get("deadline"),
            created_at=goal_data.get("created_at", 0),
        )

        # Plan actions
        plan = self.plan_actions(
            npc_id=npc_id, goal=goal, world_state=data.world_state, npc_state=data.npc_state
        )

        return {"plan": plan, "goal": goal_data, "npc_id": npc_id}
