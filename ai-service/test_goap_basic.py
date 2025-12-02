"""
Basic test to verify GOAP planner functionality.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from goap import Action, GOAPPlanner


def test_simple_plan():
    """Test that planner can find a simple 2-step plan."""
    # Define actions
    actions = [
        Action(
            name="get_wood", preconditions={"near_tree": True}, effects={"has_wood": True}, cost=1.0
        ),
        Action(
            name="craft_plank",
            preconditions={"has_wood": True},
            effects={"has_plank": True},
            cost=1.0,
        ),
    ]

    # Initial state
    start_state = {"near_tree": True, "has_wood": False, "has_plank": False}

    # Goal state
    goal_state = {"has_plank": True}

    # Plan
    planner = GOAPPlanner(actions, max_depth=5)
    plan = planner.plan(start_state, goal_state)

    print(f"Plan: {plan}")
    assert plan == ["get_wood", "craft_plank"], f"Expected ['get_wood', 'craft_plank'], got {plan}"
    print("✓ Simple plan test passed!")


def test_no_plan_found():
    """Test that planner returns empty list when no plan exists."""
    actions = [
        Action(
            name="craft_plank",
            preconditions={"has_wood": True},
            effects={"has_plank": True},
            cost=1.0,
        )
    ]

    start_state = {"has_wood": False}
    goal_state = {"has_plank": True}

    planner = GOAPPlanner(actions, max_depth=5)
    plan = planner.plan(start_state, goal_state)

    assert plan == [], f"Expected empty plan, got {plan}"
    print("✓ No plan found test passed!")


def test_plan_validation():
    """Test plan validation."""
    actions = [
        Action(
            name="get_wood", preconditions={"near_tree": True}, effects={"has_wood": True}, cost=1.0
        )
    ]

    start_state = {"near_tree": True, "has_wood": False}
    goal_state = {"has_wood": True}

    planner = GOAPPlanner(actions)
    plan = ["get_wood"]

    is_valid = planner.validate_plan(plan, start_state, goal_state)
    assert is_valid, "Plan should be valid"
    print("✓ Plan validation test passed!")


if __name__ == "__main__":
    print("Running GOAP Planner Tests...")
    test_simple_plan()
    test_no_plan_found()
    test_plan_validation()
    print("\n✅ All tests passed!")
