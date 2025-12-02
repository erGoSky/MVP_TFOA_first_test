"""
Test GoalManager functionality.
"""

import os
import sys
import unittest

# Add ai-service directory to path
sys.path.append(os.path.dirname(__file__))

from planning.goal_manager import GoalManager
from planning.types import Goal, GoalType


class TestGoalManager(unittest.TestCase):
    def setUp(self):
        self.manager = GoalManager()
        self.npc_id = "npc_1"

    def test_add_goal(self):
        """Test adding a goal."""
        goal = Goal(id="eat_food", type=GoalType.MAINTAIN_NEED, priority=0.8, conditions=[])
        self.manager.add_goal(self.npc_id, goal)

        active_goal = self.manager.get_next_goal(self.npc_id)
        self.assertIsNotNone(active_goal)
        self.assertEqual(active_goal.id, "eat_food")

    def test_priority_sorting(self):
        """Test that higher priority goals are returned first."""
        low_prio = Goal(id="sleep", type=GoalType.MAINTAIN_NEED, priority=0.5, conditions=[])
        high_prio = Goal(id="eat_food", type=GoalType.MAINTAIN_NEED, priority=0.9, conditions=[])

        self.manager.add_goal(self.npc_id, low_prio)
        self.manager.add_goal(self.npc_id, high_prio)

        first = self.manager.get_next_goal(self.npc_id)
        self.assertEqual(first.id, "eat_food")

        # Complete first goal
        self.manager.complete_goal(self.npc_id, first.id)

        second = self.manager.get_next_goal(self.npc_id)
        self.assertEqual(second.id, "sleep")

    def test_abandon_goal(self):
        """Test abandoning a goal."""
        goal = Goal(id="impossible_task", type=GoalType.OBTAIN_ITEM, priority=0.5, conditions=[])
        self.manager.add_goal(self.npc_id, goal)

        self.manager.abandon_goal(self.npc_id, goal.id, "Too hard")

        next_goal = self.manager.get_next_goal(self.npc_id)
        self.assertIsNone(next_goal)

    def test_duplicate_goal_prevention(self):
        """Test that duplicate goals are not added."""
        goal1 = Goal(id="eat", type=GoalType.MAINTAIN_NEED, priority=0.5, conditions=[])
        goal2 = Goal(id="eat", type=GoalType.MAINTAIN_NEED, priority=0.8, conditions=[])

        self.manager.add_goal(self.npc_id, goal1)
        self.manager.add_goal(self.npc_id, goal2)  # Should update priority, not add duplicate

        # Check internal queue size (implementation detail, but useful for test)
        queue = self.manager.goals.get(self.npc_id, [])
        self.assertEqual(len(queue), 1)
        self.assertEqual(queue[0].priority, 0.8)


if __name__ == "__main__":
    unittest.main()
