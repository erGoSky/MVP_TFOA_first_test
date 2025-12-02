from typing import List, Dict, Any
import time

from .types import Goal, GoalType, StateCondition

class NeedsGoalGenerator:
    def generate_goals(self, npc_state: Dict[str, Any]) -> List[Goal]:
        """Generate goals based on NPC needs and state."""
        goals = []
        
        needs = npc_state.get('needs', {})
        stats = npc_state.get('stats', {})
        inventory = npc_state.get('inventory', [])
        home_id = npc_state.get('homeId')
        
        # 1. Hunger -> Eat
        hunger = needs.get('hunger', 0)
        if hunger > 0.7:
            priority = (hunger - 0.5) * 2.0  # 0.7 -> 0.4, 1.0 -> 1.0
            goals.append(Goal(
                id=f"eat_food_{int(time.time())}",
                type=GoalType.MAINTAIN_NEED,
                priority=priority,
                conditions=[{'key': 'hunger', 'value': 0.0, 'op': '<'}] # Simplified condition
            ))

        # 2. Energy -> Sleep
        energy = needs.get('energy', 1.0)
        if energy < 0.2:
            priority = (1.0 - energy) * 1.5
            goals.append(Goal(
                id=f"rest_{int(time.time())}",
                type=GoalType.MAINTAIN_NEED,
                priority=priority,
                conditions=[{'key': 'energy', 'value': 1.0, 'op': '>'}]
            ))

        # 3. Wealth/Housing -> Build House
        money = stats.get('money', 0)
        if money >= 100 and not home_id:
            goals.append(Goal(
                id="build_house",
                type=GoalType.BUILD_STRUCTURE,
                priority=0.6,
                conditions=[{'key': 'has_home', 'value': True}]
            ))

        return goals
