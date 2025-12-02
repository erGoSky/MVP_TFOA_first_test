"""
Test GoalGenerator functionality.
"""

import os
import sys
import unittest

# Add ai-service directory to path
sys.path.append(os.path.dirname(__file__))

from planning.goal_generator import NeedsGoalGenerator
from planning.types import GoalType


class TestGoalGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = NeedsGoalGenerator()

    def test_hunger_goal_generation(self):
        """Test generating EatGoal when hungry."""
        npc_state = {
            "id": "npc_1",
            "needs": {"hunger": 0.8, "energy": 0.5, "social": 0.5},
            "stats": {"money": 10},
            "inventory": [],
        }

        goals = self.generator.generate_goals(npc_state)

        has_eat_goal = any(
            g.type == GoalType.MAINTAIN_NEED and g.id.startswith("eat_food") for g in goals
        )
        self.assertTrue(has_eat_goal, "Should generate eat goal when hunger > 0.7")

    def test_sleep_goal_generation(self):
        """Test generating SleepGoal when tired."""
        npc_state = {
            "id": "npc_1",
            "needs": {"hunger": 0.0, "energy": 0.1, "social": 0.5},
            "stats": {"money": 10},
            "inventory": [],
        }

        goals = self.generator.generate_goals(npc_state)

        has_sleep_goal = any(
            g.type == GoalType.MAINTAIN_NEED and g.id.startswith("rest") for g in goals
        )
        self.assertTrue(has_sleep_goal, "Should generate sleep goal when energy < 0.2")

    def test_build_house_goal(self):
        """Test generating BuildHouseGoal when wealthy and homeless."""
        npc_state = {
            "id": "npc_1",
            "needs": {"hunger": 0.0, "energy": 1.0, "social": 0.5},
            "stats": {"money": 200},
            "inventory": [],
            "homeId": None,
        }

        goals = self.generator.generate_goals(npc_state)

        has_build_goal = any(g.type == GoalType.BUILD_STRUCTURE for g in goals)
        self.assertTrue(has_build_goal, "Should generate build goal when wealthy and homeless")

    def test_no_goals_when_satisfied(self):
        """Test no critical goals generated when needs are met."""
        npc_state = {
            "id": "npc_1",
            "needs": {"hunger": 0.0, "energy": 1.0, "social": 0.5},
            "stats": {"money": 10},
            "inventory": [],
            "homeId": "house_1",
        }

        goals = self.generator.generate_goals(npc_state)

        # Might generate some low priority goals, but check for critical ones
        critical_goals = [g for g in goals if g.priority > 0.7]
        self.assertEqual(
            len(critical_goals), 0, "Should not generate critical goals when satisfied"
        )


if __name__ == "__main__":
    unittest.main()
