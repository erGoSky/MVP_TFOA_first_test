"""
Enhanced GOAP (Goal-Oriented Action Planning) Planner.

Improvements over basic version:
- Max depth limit to prevent infinite loops
- Heuristic function for better A* performance  
- Plan validation
- Simple plan caching
- Complete action sequence return
"""

from typing import List, Dict, Set, Any, Optional, Tuple
import heapq


class Action:
    """Represents an action that can be performed in the world."""
    
    def __init__(self, name: str, preconditions: Dict[str, Any], effects: Dict[str, Any], cost: float = 1.0):
        self.name = name
        self.preconditions = preconditions
        self.effects = effects
        self.cost = cost

    def is_valid(self, state: Dict[str, Any]) -> bool:
        """Check if action preconditions are met in given state."""
        for key, value in self.preconditions.items():
            state_value = state.get(key)
            # Handle numeric comparisons for values like energy, hunger
            if isinstance(value, (int, float)) and isinstance(state_value, (int, float)):
                if state_value < value:  # Assume precondition is minimum required
                    return False
            elif state_value != value:
                return False
        return True

    def apply(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Apply action effects to state, returning new state."""
        new_state = state.copy()
        for key, value in self.effects.items():
            if isinstance(value, (int, float)) and key in new_state:
                # Additive effects (e.g., energy: -0.05 means subtract 0.05)
                new_state[key] = new_state.get(key, 0) + value
            else:
                # Direct assignment
                new_state[key] = value
        return new_state


class GOAPPlanner:
    """A* based planner for goal-oriented action planning."""
    
    def __init__(self, actions: List[Action], max_depth: int = 10):
        self.actions = actions
        self.max_depth = max_depth
        self.plan_cache: Dict[Tuple, List[str]] = {}
    
    def plan(self, start_state: Dict[str, Any], goal_state: Dict[str, Any]) -> List[str]:
        """
        Find optimal action sequence from start_state to goal_state.
        
        Returns:
            List of action names, or empty list if no plan found
        """
        # Check cache
        cache_key = (
            tuple(sorted(start_state.items())),
            tuple(sorted(goal_state.items()))
        )
        if cache_key in self.plan_cache:
            return self.plan_cache[cache_key]
        
        # A* Search with depth limit
        # Priority Queue: (f_cost, g_cost, depth, count, current_state, plan)
        # f_cost = g_cost + heuristic
        # count is used to break ties and avoid comparing dictionaries
        count = 0
        h_start = self._heuristic(start_state, goal_state)
        queue = [(h_start, 0, 0, count, start_state, [])]
        visited = set()
        
        while queue:
            f_cost, g_cost, depth, _, current_state, plan = heapq.heappop(queue)
            
            # Check if goal is met
            if self._check_goal(current_state, goal_state):
                self.plan_cache[cache_key] = plan
                return plan
            
            # Depth limit check
            if depth >= self.max_depth:
                continue
            
            # Visited check
            state_key = tuple(sorted(current_state.items()))
            if state_key in visited:
                continue
            visited.add(state_key)
            
            # Try all valid actions
            for action in self.actions:
                if action.is_valid(current_state):
                    new_state = action.apply(current_state)
                    new_g_cost = g_cost + action.cost
                    new_h_cost = self._heuristic(new_state, goal_state)
                    new_f_cost = new_g_cost + new_h_cost
                    new_plan = plan + [action.name]
                    new_depth = depth + 1
                    count += 1
                    
                    heapq.heappush(queue, (new_f_cost, new_g_cost, new_depth, count, new_state, new_plan))
        
        # No plan found
        return []
    
    def _heuristic(self, state: Dict[str, Any], goal: Dict[str, Any]) -> float:
        """
        Estimate cost to reach goal from state.
        Simple heuristic: count unmet goal conditions.
        """
        unmet = 0
        for key, target_value in goal.items():
            current_value = state.get(key)
            
            # Handle numeric thresholds
            if isinstance(target_value, (int, float)) and isinstance(current_value, (int, float)):
                # If target is 0, assume we want <= (e.g. hunger, fatigue)
                if target_value == 0 and current_value <= 0.05:
                    continue
                # If target is positive, assume we want >= (e.g. gold, wood)
                # Exception: Coordinates or specific values might need strict equality, 
                # but in this system we use 'near_X' flags for location.
                if target_value > 0 and current_value >= target_value:
                    continue
            
            if current_value != target_value:
                unmet += 1
        return float(unmet)
    
    def _check_goal(self, state: Dict[str, Any], goal: Dict[str, Any]) -> bool:
        """Check if all goal conditions are met."""
        for key, target_value in goal.items():
            current_value = state.get(key)
            
            # Handle numeric thresholds
            if isinstance(target_value, (int, float)) and isinstance(current_value, (int, float)):
                # If target is 0, assume we want <= (e.g. hunger, fatigue)
                if target_value == 0 and current_value <= 0.05:
                    continue
                # If target is positive, assume we want >= (e.g. gold, wood)
                if target_value > 0 and current_value >= target_value:
                    continue
            
            if current_value != target_value:
                return False
        return True
    
    def validate_plan(self, plan: List[str], start_state: Dict[str, Any], goal_state: Dict[str, Any]) -> bool:
        """
        Validate that a plan successfully reaches the goal.
        
        Returns:
            True if plan is valid, False otherwise
        """
        current_state = start_state.copy()
        
        for action_name in plan:
            # Find action
            action = next((a for a in self.actions if a.name == action_name), None)
            if not action:
                return False
            
            # Check if action is valid in current state
            if not action.is_valid(current_state):
                return False
            
            # Apply action
            current_state = action.apply(current_state)
        
        # Check if goal is reached
        return self._check_goal(current_state, goal_state)
    
    def get_plan_cost(self, plan: List[str]) -> float:
        """Calculate total cost of a plan."""
        total_cost = 0.0
        for action_name in plan:
            action = next((a for a in self.actions if a.name == action_name), None)
            if action:
                total_cost += action.cost
        return total_cost
    
    def clear_cache(self):
        """Clear the plan cache."""
        self.plan_cache.clear()
