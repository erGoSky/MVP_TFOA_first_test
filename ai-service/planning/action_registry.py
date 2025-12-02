"""
Action Registry for GOAP system.

Defines all available actions NPCs can perform, organized by category:
- Gathering (Chop, Mine, Gather, Hunt, Farm)
- Item Management (Pickup, Drop, Store, Transfer)
- Crafting (Craft, Process, Repair)
- Trade (Buy, Sell, PostOrder, AcceptOrder)
- Combat (Attack, CastSpell, Block, Dodge, Flee, Heal)
- Social/Learning (Talk, Socialize, Learn, Teach, Recruit)
- Survival (Eat, Drink, Sleep)
"""

import os
import sys
from typing import Any, Dict, List, Optional

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from goap import Action


class ActionRegistry:
    """Singleton registry of all available actions."""

    _instance = None
    _actions: Dict[str, Action] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_actions()
        return cls._instance

    def _initialize_actions(self):
        """Register all available actions."""
        # Gathering Actions
        self._register_gathering_actions()
        # Item Management
        self._register_item_actions()
        # Crafting
        self._register_crafting_actions()
        # Trade
        self._register_trade_actions()
        # Combat
        self._register_combat_actions()
        # Social/Learning
        self._register_social_actions()
        # Survival
        self._register_survival_actions()

    def _register_gathering_actions(self):
        """Register gathering actions."""
        # Chop - Extract wood from trees
        self.register_action(
            Action(
                name="chop",
                preconditions={"has_axe": True, "near_tree": True, "energy": 0.1},
                effects={"has_wood": 1, "energy": -0.05},
                cost=2.0,
            )
        )

        # Mine - Extract ore, stone, or coal
        self.register_action(
            Action(
                name="mine",
                preconditions={"has_pickaxe": True, "near_ore": True, "energy": 0.1},
                effects={"has_ore": 1, "energy": -0.05},
                cost=2.5,
            )
        )

        # Gather - Collect herbs, berries, mushrooms
        self.register_action(
            Action(
                name="gather",
                preconditions={"near_gatherable": True},
                effects={"has_gatherable": 1},
                cost=1.0,
            )
        )

        # Hunt - Acquire meat and hides
        self.register_action(
            Action(
                name="hunt",
                preconditions={"has_weapon": True, "near_animal": True, "energy": 0.2},
                effects={"has_meat": 1, "has_hide": 1, "energy": -0.1},
                cost=3.0,
            )
        )

        # Farm - Sow, water, harvest crops
        self.register_action(
            Action(
                name="farm",
                preconditions={"has_seeds": True, "near_farm": True},
                effects={"has_crops": 1},
                cost=2.0,
            )
        )

    def _register_item_actions(self):
        """Register item management actions."""
        # Pickup - Take item from ground
        self.register_action(
            Action(
                name="pickup",
                preconditions={"near_item": True, "inventory_space": True},
                effects={"has_item": 1},
                cost=0.5,
            )
        )

        # Drop - Remove item from inventory
        self.register_action(
            Action(
                name="drop", preconditions={"has_item": True}, effects={"has_item": -1}, cost=0.3
            )
        )

        # Store - Place item in container
        self.register_action(
            Action(
                name="store",
                preconditions={"has_item": True, "near_container": True},
                effects={"has_item": -1, "container_has_item": 1},
                cost=0.5,
            )
        )

        # Transfer - Move items between inventories
        self.register_action(
            Action(
                name="transfer",
                preconditions={"has_item": True, "near_target": True},
                effects={"has_item": -1, "target_has_item": 1},
                cost=0.5,
            )
        )

    def _register_crafting_actions(self):
        """Register crafting actions."""
        # Craft - Create final product
        self.register_action(
            Action(
                name="craft",
                preconditions={"has_materials": True, "near_workstation": True},
                effects={"has_product": 1, "has_materials": -1},
                cost=2.0,
            )
        )

        # Process - Convert raw to refined
        self.register_action(
            Action(
                name="process",
                preconditions={"has_raw_material": True, "near_processor": True},
                effects={"has_refined_material": 1, "has_raw_material": -1},
                cost=1.5,
            )
        )

        # Repair - Restore item condition
        self.register_action(
            Action(
                name="repair",
                preconditions={"has_damaged_item": True, "has_repair_materials": True},
                effects={"item_durability": 1.0, "has_repair_materials": -1},
                cost=1.0,
            )
        )

    def _register_trade_actions(self):
        """Register trade actions."""
        # Buy - Acquire item with gold
        self.register_action(
            Action(
                name="buy",
                preconditions={"has_gold": True, "near_merchant": True, "item_available": True},
                effects={"has_item": 1, "gold": -1},
                cost=1.0,
            )
        )

        # Sell - Offer item for gold
        self.register_action(
            Action(
                name="sell",
                preconditions={"has_item": True, "near_merchant": True},
                effects={"has_item": -1, "gold": 1},
                cost=1.0,
            )
        )

        # PostOrder - Create quest board task
        self.register_action(
            Action(
                name="post_order",
                preconditions={"has_gold": True, "near_quest_board": True},
                effects={"order_posted": True, "gold": -0.5},
                cost=0.5,
            )
        )

        # AcceptOrder - Take quest board task
        self.register_action(
            Action(
                name="accept_order",
                preconditions={"near_quest_board": True, "order_available": True},
                effects={"has_order": True},
                cost=0.3,
            )
        )

    def _register_combat_actions(self):
        """Register combat actions."""
        # Attack - Melee or ranged assault
        self.register_action(
            Action(
                name="attack",
                preconditions={"has_weapon": True, "near_enemy": True, "energy": 0.1},
                effects={"enemy_health": -1, "energy": -0.05},
                cost=1.5,
            )
        )

        # CastSpell - Use magic
        self.register_action(
            Action(
                name="cast_spell",
                preconditions={"has_mana": True, "knows_spell": True, "near_target": True},
                effects={"mana": -1, "spell_effect": True},
                cost=2.0,
            )
        )

        # Block - Mitigate damage
        self.register_action(
            Action(
                name="block",
                preconditions={"has_shield": True, "in_combat": True},
                effects={"damage_reduction": 0.5},
                cost=0.5,
            )
        )

        # Dodge - Evade attack
        self.register_action(
            Action(
                name="dodge",
                preconditions={"energy": 0.1, "in_combat": True},
                effects={"energy": -0.05, "evaded": True},
                cost=0.8,
            )
        )

        # Flee - Exit combat
        self.register_action(
            Action(
                name="flee",
                preconditions={"in_combat": True},
                effects={"in_combat": False},
                cost=1.0,
            )
        )

        # Heal - Restore health
        self.register_action(
            Action(
                name="heal",
                preconditions={"has_healing_item": True},
                effects={"health": 1, "has_healing_item": -1},
                cost=0.5,
            )
        )

    def _register_social_actions(self):
        """Register social and learning actions."""
        # Talk - Initiate dialogue
        self.register_action(
            Action(name="talk", preconditions={"near_npc": True}, effects={"social": 0.1}, cost=0.3)
        )

        # Socialize - Spend time in tavern
        self.register_action(
            Action(
                name="socialize",
                preconditions={"near_tavern": True},
                effects={"social": 0.3, "gold": -0.1},
                cost=1.0,
            )
        )

        # Learn - Gain skills from master
        self.register_action(
            Action(
                name="learn",
                preconditions={"near_teacher": True, "has_gold": True},
                effects={"skill_level": 1, "gold": -1},
                cost=2.0,
            )
        )

        # Teach - Impart knowledge
        self.register_action(
            Action(
                name="teach",
                preconditions={"near_student": True, "skill_level": 50},
                effects={"gold": 0.5, "social": 0.1},
                cost=1.5,
            )
        )

        # Recruit - Invite to team
        self.register_action(
            Action(
                name="recruit",
                preconditions={"near_npc": True, "has_gold": True, "social": 0.5},
                effects={"team_member": 1, "gold": -2},
                cost=2.0,
            )
        )

    def _register_survival_actions(self):
        """Register survival actions."""
        # Eat - Consume food
        self.register_action(
            Action(
                name="eat",
                preconditions={"has_food": True},
                effects={"hunger": -0.5, "has_food": -1},
                cost=0.5,
            )
        )

        # Drink - Consume water
        self.register_action(
            Action(
                name="drink",
                preconditions={"has_water": True},
                effects={"thirst": -0.5, "has_water": -1},
                cost=0.3,
            )
        )

        # Sleep - Restore energy
        self.register_action(
            Action(
                name="sleep", preconditions={"near_bed": True}, effects={"energy": 1.0}, cost=1.0
            )
        )

    def register_action(self, action: Action):
        """Register a new action."""
        self._actions[action.name] = action

    def get_action(self, name: str) -> Optional[Action]:
        """Get action by name."""
        return self._actions.get(name)

    def get_all_actions(self) -> List[Action]:
        """Get all registered actions."""
        return list(self._actions.values())

    def get_actions_by_category(self, category: str) -> List[Action]:
        """Get actions filtered by category."""
        # This is a simple implementation - could be enhanced with proper categorization
        category_actions = {
            "gathering": ["chop", "mine", "gather", "hunt", "farm"],
            "items": ["pickup", "drop", "store", "transfer"],
            "crafting": ["craft", "process", "repair"],
            "trade": ["buy", "sell", "post_order", "accept_order"],
            "combat": ["attack", "cast_spell", "block", "dodge", "flee", "heal"],
            "social": ["talk", "socialize", "learn", "teach", "recruit"],
            "survival": ["eat", "drink", "sleep"],
        }

        action_names = category_actions.get(category, [])
        return [self._actions[name] for name in action_names if name in self._actions]

    def calculate_cost(self, action_name: str, personality: Dict[str, float]) -> float:
        """Calculate action cost with personality modifiers."""
        action = self.get_action(action_name)
        if not action:
            return float("inf")

        base_cost = action.cost

        # Apply personality modifiers
        # Lazy NPCs find physical actions more costly
        if action_name in ["chop", "mine", "farm", "hunt"]:
            laziness = personality.get("laziness", 0.5)
            base_cost *= 1 + laziness

        # Greedy NPCs prefer profitable actions
        if action_name in ["sell", "work", "accept_order"]:
            greed = personality.get("greed", 0.5)
            base_cost *= 1 - greed * 0.3

        # Social NPCs prefer social actions
        if action_name in ["talk", "socialize", "recruit"]:
            sociability = personality.get("sociability", 0.5)
            base_cost *= 1 - sociability * 0.2

        return max(0.1, base_cost)  # Minimum cost of 0.1

    def expand_actions(
        self, npc_state: Dict[str, Any], world_state: Dict[str, Any]
    ) -> List[Action]:
        """Generate context-specific actions based on world state."""
        actions = []

        # 1. Movement & Gathering (Resources)
        resources = world_state.get("resources", {})
        for r_id, r_data in resources.items():
            r_type = r_data.get("type", "unknown")

            # Move to resource
            actions.append(
                Action(
                    name=f"move_to_{r_id}",
                    preconditions={},
                    effects={f"near_{r_id}": True},
                    cost=1.0,  # Distance cost could be calculated here
                )
            )

            # Gather from resource
            # Map resource type to gather action
            if r_type in [
                "bush_berry",
                "tree_apple",
                "wild_wheat",
                "mushroom_red",
                "mushroom_brown",
            ]:
                actions.append(
                    Action(
                        name=f"gather_{r_type}",
                        preconditions={f"near_{r_id}": True},
                        effects={f"has_{r_type}": 1},
                        cost=1.0,
                    )
                )
            elif r_type in ["tree_oak", "tree_pine"]:
                actions.append(
                    Action(
                        name=f"chop_{r_type}",
                        preconditions={f"near_{r_id}": True, "has_axe": True},
                        effects={"has_wood": 1},
                        cost=2.0,
                    )
                )
            elif r_type in ["rock_stone", "ore_iron"]:
                actions.append(
                    Action(
                        name=f"mine_{r_type}",
                        preconditions={f"near_{r_id}": True, "has_pickaxe": True},
                        effects={
                            "has_stone": 1 if "stone" in r_type else 0,
                            "has_ore": 1 if "ore" in r_type else 0,
                        },
                        cost=3.0,
                    )
                )

        # 2. Eating (Inventory)
        # We assume if we have the item, we can eat it
        # But for planning, we need an action that converts 'has_item' to 'hunger reduced'
        food_items = [
            "bush_berry",
            "tree_apple",
            "bread",
            "mushroom_red",
            "mushroom_brown",
            "meat_cooked",
        ]

        # Add generic eat actions for all known food types (so planner knows it CAN eat them if it gets them)
        for food in food_items:
            actions.append(
                Action(
                    name=f"eat_{food}",
                    preconditions={f"has_{food}": True},
                    effects={"hunger": -0.3},  # Simplified
                    cost=0.5,
                )
            )

        # 3. Buying (Market)
        market_prices = world_state.get("market_prices", {})
        for item, price in market_prices.items():
            actions.append(
                Action(
                    name=f"buy_{item}",
                    preconditions={"gold": price},  # Check actual gold amount
                    effects={f"has_{item}": 1, "gold": -price},
                    cost=1.0,
                )
            )

        # 4. Work (Generic)
        # Always allow working to get gold
        actions.append(
            Action(
                name="work_labor", preconditions={}, effects={"gold": 5, "energy": -0.2}, cost=5.0
            )
        )

        return actions


# Global registry instance
registry = ActionRegistry()
