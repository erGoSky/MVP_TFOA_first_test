"""
Core planning types for GOAP system.

This module defines the fundamental data structures used in goal-oriented action planning:
- Goal: Represents an NPC's objective
- WorldState: Simplified world representation for planning
- StateCondition: Requirements that must be met
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class GoalType(Enum):
    """Types of goals NPCs can pursue."""

    MAINTAIN_NEED = "maintain_need"  # Satisfy hunger, energy, health
    OBTAIN_ITEM = "obtain_item"  # Get a specific item
    REACH_SKILL = "reach_skill"  # Improve a skill level
    ACCUMULATE_WEALTH = "accumulate_wealth"  # Earn gold
    BUILD_STRUCTURE = "build_structure"  # Construct a building
    COMPLETE_ORDER = "complete_order"  # Fulfill a quest board order
    SOCIALIZE = "socialize"  # Satisfy social needs
    LEARN = "learn"  # Acquire knowledge/skills


@dataclass
class StateCondition:
    """A condition that must be true in a world state."""

    type: str  # 'has_item', 'near_location', 'skill_level', 'stat_value'
    key: str  # Item name, location ID, skill name, stat name
    value: Any  # Required value (quantity, distance, level, etc.)
    operator: str = "=="  # Comparison operator: ==, >=, <=, >, <

    def is_met(self, state: Dict[str, Any]) -> bool:
        """Check if this condition is satisfied in the given state."""
        actual_value = state.get(self.key)
        if actual_value is None:
            return False

        if self.operator == "==":
            return actual_value == self.value
        elif self.operator == ">=":
            return actual_value >= self.value
        elif self.operator == "<=":
            return actual_value <= self.value
        elif self.operator == ">":
            return actual_value > self.value
        elif self.operator == "<":
            return actual_value < self.value
        else:
            return False


@dataclass
class Goal:
    """Represents an NPC's goal."""

    id: str
    type: GoalType
    priority: float  # Base priority (0-1)
    conditions: List[StateCondition]  # What must be true to complete this goal
    is_global: bool = False  # Global (long-term) vs Local (immediate)
    deadline: Optional[int] = None  # Tick deadline (None = no deadline)
    created_at: int = 0  # Tick when goal was created

    def is_complete(self, state: Dict[str, Any]) -> bool:
        """Check if all goal conditions are met."""
        return all(condition.is_met(state) for condition in self.conditions)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize goal for API transmission."""
        return {
            "id": self.id,
            "type": self.type.value,
            "priority": self.priority,
            "conditions": [
                {"type": c.type, "key": c.key, "value": c.value, "operator": c.operator}
                for c in self.conditions
            ],
            "is_global": self.is_global,
            "deadline": self.deadline,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Goal":
        """Deserialize goal from API data."""
        return cls(
            id=data["id"],
            type=GoalType(data["type"]),
            priority=data["priority"],
            conditions=[
                StateCondition(
                    type=c["type"], key=c["key"], value=c["value"], operator=c.get("operator", "==")
                )
                for c in data["conditions"]
            ],
            is_global=data.get("is_global", False),
            deadline=data.get("deadline"),
            created_at=data.get("created_at", 0),
        )


@dataclass
class WorldState:
    """Simplified world state for planning purposes."""

    # NPC state
    npc_id: str
    position: Dict[str, float]  # {x, y}
    inventory: Dict[str, int]  # item_type -> quantity
    skills: Dict[str, float]  # skill_name -> level
    stats: Dict[str, float]  # health, money, energy, hunger

    # World knowledge
    resources: Dict[str, Any]  # resource_id -> {type, position, amount}
    buildings: Dict[str, Any]  # building_id -> {type, position, inventory}
    market_prices: Dict[str, float]  # item_type -> price
    quest_board: List[Dict[str, Any]]  # Available orders

    def to_planning_state(self) -> Dict[str, Any]:
        """Convert to flat dict for GOAP planner."""
        state = {}

        # Add inventory items
        for item_type, quantity in self.inventory.items():
            state[f"has_{item_type}"] = quantity

        # Add skills
        for skill_name, level in self.skills.items():
            state[f"skill_{skill_name}"] = level

        # Add stats
        for stat_name, value in self.stats.items():
            state[stat_name] = value

        # Add position
        state["pos_x"] = self.position["x"]
        state["pos_y"] = self.position["y"]

        return state

    def get_item_count(self, item_type: str) -> int:
        """Get quantity of item in inventory."""
        return self.inventory.get(item_type, 0)

    def has_item(self, item_type: str, quantity: int = 1) -> bool:
        """Check if NPC has required quantity of item."""
        return self.get_item_count(item_type) >= quantity

    def get_skill_level(self, skill_name: str) -> float:
        """Get NPC's skill level."""
        return self.skills.get(skill_name, 0.0)

    def get_stat(self, stat_name: str) -> float:
        """Get NPC's stat value."""
        return self.stats.get(stat_name, 0.0)
