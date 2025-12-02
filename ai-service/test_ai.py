import json

import requests

BASE_URL = "http://localhost:8000"


def test_utility():
    print("Testing Utility Calculation...")
    payload = {
        "npc": {
            "id": "npc1",
            "needs": {"hunger": 0.8, "energy": 0.5, "social": 0.2},
            "stats": {"health": 1.0, "money": 10.0, "speed": 1.0},
        },
        "options": [
            {"name": "eat_apple", "type": "eat", "params": {"value": 0.5}},
            {"name": "sleep", "type": "sleep", "params": {"value": 0.8}},
        ],
    }
    try:
        response = requests.post(f"{BASE_URL}/calculate_utility", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")


def test_goap():
    print("\nTesting GOAP Planner...")
    payload = {
        "start_state": {"has_wood": False, "at_forest": False},
        "goal_state": {"has_wood": True},
        "available_actions": [
            {
                "name": "move_to_forest",
                "preconditions": {"at_forest": False},
                "effects": {"at_forest": True},
                "cost": 1,
            },
            {
                "name": "chop_wood",
                "preconditions": {"at_forest": True},
                "effects": {"has_wood": True},
                "cost": 2,
            },
        ],
    }
    try:
        response = requests.post(f"{BASE_URL}/plan_action", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_utility()
    test_goap()
