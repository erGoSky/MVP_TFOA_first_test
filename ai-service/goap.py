from typing import List, Dict, Set, Any
import heapq

class Action:
    def __init__(self, name: str, preconditions: Dict[str, Any], effects: Dict[str, Any], cost: float = 1.0):
        self.name = name
        self.preconditions = preconditions
        self.effects = effects
        self.cost = cost

    def is_valid(self, state: Dict[str, Any]) -> bool:
        for key, value in self.preconditions.items():
            if state.get(key) != value:
                return False
        return True

    def apply(self, state: Dict[str, Any]) -> Dict[str, Any]:
        new_state = state.copy()
        new_state.update(self.effects)
        return new_state

class GOAPPlanner:
    def __init__(self, actions: List[Action]):
        self.actions = actions

    def plan(self, start_state: Dict[str, Any], goal_state: Dict[str, Any]) -> List[str]:
        # A* Search
        # Priority Queue: (cost, current_state, plan)
        # Note: Dict is not hashable, so we need a way to represent state in visited set.
        # For MVP, we assume state keys are strings and values are primitives.
        
        queue = [(0, start_state, [])]
        visited = set()

        while queue:
            cost, current_state, plan = heapq.heappop(queue)

            # Check if goal is met
            if self.check_goal(current_state, goal_state):
                return plan

            state_key = tuple(sorted(current_state.items()))
            if state_key in visited:
                continue
            visited.add(state_key)

            # Try all actions
            # In GOAP, we usually search backwards from goal, or forward. Forward is easier to implement for simple cases.
            # Let's try forward search for now.
            for action in self.actions:
                if action.is_valid(current_state):
                    new_state = action.apply(current_state)
                    new_cost = cost + action.cost
                    new_plan = plan + [action.name]
                    heapq.heappush(queue, (new_cost, new_state, new_plan))
        
        return [] # No plan found

    def check_goal(self, state: Dict[str, Any], goal: Dict[str, Any]) -> bool:
        for key, value in goal.items():
            if state.get(key) != value:
                return False
        return True
