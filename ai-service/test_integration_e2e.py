"""
End-to-end integration test for the AI Service.
Simulates the full loop: Needs -> Goal -> Plan -> Response.
"""

import json
import time

import requests

BASE_URL = "http://localhost:8000"


def test_full_loop():
    print("\n🔄 Starting End-to-End Integration Test...")

    # 1. Simulate NPC State (Hungry)
    npc_state = {
        "id": "npc_e2e_1",
        "name": "Hungry Henry",
        "position": {"x": 10, "y": 10},
        "needs": {"hunger": 0.9, "energy": 1.0, "social": 0.5},  # Very hungry
        "stats": {"money": 50, "health": 100, "speed": 1},
        "skills": {"gathering": 10, "crafting": 5, "trading": 5},
        "inventory": [],  # No food
        "personality": {"archetype": "survivor"},
    }

    world_state = {
        "resources": {"berry_bush_1": {"type": "bush_berry", "position": {"x": 12, "y": 12}}},
        "market_prices": {"bread": 5},
        "buildings": {},
    }

    # 2. Generate Goal (Client-side logic simulation)
    # In the real app, TypeScript does this. Here we simulate the request payload.
    # We expect the goal to be "eat_food"

    goal = {
        "id": "eat_food_priority",
        "type": "maintain_need",
        "priority": 0.8,
        "conditions": [{"key": "hunger", "value": 0.0, "op": "<"}],
    }

    # 3. Request Plan
    print(f"   Requesting plan for {npc_state['name']} (Hunger: {npc_state['needs']['hunger']})...")

    payload = {"npc_state": npc_state, "goal": goal, "world_state": world_state}

    try:
        response = requests.post(f"{BASE_URL}/plan_action_enhanced", json=payload)
        response.raise_for_status()
        data = response.json()

        if data["success"]:
            plan = data["plan"]
            print(f"   ✅ Plan received: {plan}")

            # Verify plan content
            # Should be: move -> pickup -> eat
            # Or: move -> buy -> eat (if shop available)
            # Given resources, likely move -> pickup -> eat

            expected_actions = ["move", "pickup", "eat"]
            # Simple check if 'eat' is in the plan
            has_eat = any("eat" in step for step in plan)

            if has_eat:
                print("   ✅ Plan contains 'eat' action.")
            else:
                print("   ❌ Plan missing 'eat' action!")
                return False

            return True
        else:
            print(f"   ❌ Planning failed: {data.get('error')}")
            return False

    except Exception as e:
        print(f"   ❌ Request failed: {e}")
        return False


def test_economic_loop():
    print("\n💰 Starting Economic Integration Test...")

    # NPC needs a sword. Has money but low crafting skill.
    npc_state = {
        "id": "npc_e2e_2",
        "name": "Rich Merchant",
        "position": {"x": 0, "y": 0},
        "needs": {"hunger": 0.0, "energy": 1.0},
        "stats": {"money": 200},
        "skills": {"gathering": 10, "crafting": 10, "trading": 80},
        "inventory": [],
        "personality": {"archetype": "merchant"},
    }

    world_state = {
        "resources": {},
        "market_prices": {"sword": 50},  # Available to buy
        "buildings": {},
    }

    goal = {
        "id": "obtain_sword",
        "type": "obtain_item",
        "item": "sword",
        "priority": 0.7,
        "conditions": [],
    }

    payload = {"npc_state": npc_state, "goal": goal, "world_state": world_state}

    try:
        response = requests.post(f"{BASE_URL}/plan_action_enhanced", json=payload)
        data = response.json()

        if data["success"]:
            plan = data["plan"]
            strategy = data.get("economic_strategy")
            print(f"   ✅ Plan received: {plan}")
            print(f"   📊 Strategy chosen: {strategy}")

            if strategy == "work_and_buy":
                print("   ✅ Correctly chose 'work_and_buy' (low skill, has money)")
                return True
            else:
                print(f"   ❌ Unexpected strategy: {strategy}")
                return False
        else:
            print(f"   ❌ Planning failed: {data.get('error')}")
            return False

    except Exception as e:
        print(f"   ❌ Request failed: {e}")
        return False


if __name__ == "__main__":
    success_1 = test_full_loop()
    success_2 = test_economic_loop()

    if success_1 and success_2:
        print("\n✅ All integration tests passed!")
        exit(0)
    else:
        print("\n❌ Some tests failed.")
        exit(1)
