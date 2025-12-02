"""
Test the enhanced /plan_action_enhanced endpoint.
"""

import json

import requests

API_URL = "http://localhost:8000"


def test_obtain_item_goal_low_skill():
    """Test planning for obtaining an item with low crafting skill."""
    print("\n🧪 Test 1: Obtain sword with low crafting skill")

    request_data = {
        "npc_state": {
            "id": "npc_1",
            "name": "Bob",
            "position": {"x": 10, "y": 10},
            "inventory": [{"type": "wood", "quantity": 5}],
            "skills": {"crafting": 20, "gathering": 70, "trading": 30},
            "stats": {"energy": 0.8, "hunger": 0.3, "health": 100, "money": 10},
            "personality": {"laziness": 0.3, "greed": 0.5, "sociability": 0.4},
        },
        "goal": {"type": "obtain_item", "item": "sword"},
        "world_state": {
            "market_prices": {"sword": 50},
            "quest_board": [],
            "resources": {"tree_1": {"type": "tree"}},
            "buildings": {},
        },
    }

    response = requests.post(f"{API_URL}/plan_action_enhanced", json=request_data)
    result = response.json()

    print(f"   Success: {result.get('success')}")
    print(f"   Economic strategy: {result.get('economic_strategy')}")
    print(f"   Plan: {result.get('plan', [])}")
    print(f"   Total cost: {result.get('total_cost')}")

    assert result["success"], "Plan should succeed"
    assert result.get("economic_strategy") == "work_and_buy", (
        "Should choose work-and-buy for low skill"
    )
    print("   ✓ Test passed!")


def test_obtain_item_goal_high_skill():
    """Test planning for obtaining an item with high crafting skill."""
    print("\n🧪 Test 2: Obtain sword with high crafting skill")

    request_data = {
        "npc_state": {
            "id": "npc_2",
            "name": "Alice",
            "position": {"x": 10, "y": 10},
            "inventory": [{"type": "wood", "quantity": 5}],
            "skills": {"crafting": 85, "gathering": 40, "trading": 30},
            "stats": {"energy": 0.8, "hunger": 0.3, "health": 100, "money": 10},
            "personality": {"laziness": 0.3, "greed": 0.5, "sociability": 0.4},
        },
        "goal": {"type": "obtain_item", "item": "sword"},
        "world_state": {
            "market_prices": {"sword": 50},
            "quest_board": [],
            "resources": {"tree_1": {"type": "tree"}},
            "buildings": {},
        },
    }

    response = requests.post(f"{API_URL}/plan_action_enhanced", json=request_data)
    result = response.json()

    print(f"   Success: {result.get('success')}")
    print(f"   Economic strategy: {result.get('economic_strategy')}")
    print(f"   Plan: {result.get('plan', [])}")
    print(f"   Total cost: {result.get('total_cost')}")

    assert result["success"], "Plan should succeed"
    assert result.get("economic_strategy") == "craft", "Should choose craft for high skill"
    print("   ✓ Test passed!")


def test_maintain_need_goal():
    """Test planning for maintaining needs (hunger)."""
    print("\n🧪 Test 3: Satisfy hunger need")

    request_data = {
        "npc_state": {
            "id": "npc_3",
            "name": "Charlie",
            "position": {"x": 10, "y": 10},
            "inventory": [{"type": "bread", "quantity": 2}],
            "skills": {"crafting": 50, "gathering": 50, "trading": 50},
            "stats": {"energy": 0.8, "hunger": 0.8, "health": 100, "money": 20},
            "personality": {"laziness": 0.3, "greed": 0.5, "sociability": 0.4},
        },
        "goal": {
            "type": "maintain_need",
            "conditions": [{"key": "hunger", "value": 0.3, "operator": "<="}],
        },
        "world_state": {"market_prices": {}, "quest_board": [], "resources": {}, "buildings": {}},
    }

    response = requests.post(f"{API_URL}/plan_action_enhanced", json=request_data)
    result = response.json()

    print(f"   Success: {result.get('success')}")
    print(f"   Plan: {result.get('plan', [])}")
    print(f"   Total cost: {result.get('total_cost')}")

    assert result["success"], "Plan should succeed"
    print("   ✓ Test passed!")


if __name__ == "__main__":
    print("🚀 Starting AI Service API Tests...")
    print("   Make sure the AI service is running: python main.py")

    try:
        # Check if service is running
        response = requests.get(f"{API_URL}/")
        print(f"   ✓ AI Service is running: {response.json()['message']}")

        # Run tests
        test_obtain_item_goal_low_skill()
        test_obtain_item_goal_high_skill()
        test_maintain_need_goal()

        print("\n✅ All API tests passed!")

    except requests.exceptions.ConnectionError:
        print("\n❌ Error: AI service is not running!")
        print("   Start it with: python main.py")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback

        traceback.print_exc()
