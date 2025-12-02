import pytest
from fastapi.testclient import TestClient

from main import ActionOption, Needs, NPCState, Stats, app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "TFOA AI Service is running"}


def test_calculate_utility_hunger():
    """Test that hungry NPC prioritizes eating"""
    npc = {
        "id": "npc1",
        "name": "TestNPC",
        "needs": {"hunger": 0.8, "energy": 0.5, "social": 0.5},
        "stats": {"health": 100, "money": 10, "speed": 1.0},
        "skills": {"gathering": 10, "crafting": 10, "trading": 10},
        "inventory": [],
        "currentAction": None,
        "homeId": None,
    }

    options = [
        {"name": "eat:bread", "type": "eat", "params": {"item": "bread", "value": 10}},
        {"name": "chop:tree", "type": "work", "params": {"profit": 5}},
    ]

    response = client.post("/calculate_utility", json={"npc": npc, "options": options})
    assert response.status_code == 200
    data = response.json()

    # Should choose to eat because hunger is high (0.8 > 0.7 threshold)
    assert data["best_action"]["type"] == "eat"
    assert data["utility"] > 1.0


def test_calculate_utility_work():
    """Test that satisfied NPC prioritizes work"""
    npc = {
        "id": "npc1",
        "name": "TestNPC",
        "needs": {"hunger": 0.1, "energy": 0.9, "social": 0.5},
        "stats": {"health": 100, "money": 10, "speed": 1.0},
        "skills": {"gathering": 10, "crafting": 10, "trading": 10},
        "inventory": [],
        "currentAction": None,
        "homeId": None,
    }

    options = [
        {"name": "eat:bread", "type": "eat", "params": {"item": "bread", "value": 10}},
        {"name": "chop:tree", "type": "work", "params": {"profit": 100}},
    ]

    response = client.post("/calculate_utility", json={"npc": npc, "options": options})
    assert response.status_code == 200
    data = response.json()

    # Should choose to work because needs are met
    assert data["best_action"]["type"] == "work"


def test_calculate_utility_sleep():
    """Test that tired NPC prioritizes sleep"""
    npc = {
        "id": "npc1",
        "name": "TestNPC",
        "needs": {"hunger": 0.1, "energy": 0.1, "social": 0.5},  # Very tired
        "stats": {"health": 100, "money": 10, "speed": 1.0},
        "skills": {"gathering": 10, "crafting": 10, "trading": 10},
        "inventory": [],
        "currentAction": None,
        "homeId": "house1",
    }

    options = [
        {"name": "sleep:bed", "type": "sleep", "params": {}},
        {"name": "chop:tree", "type": "work", "params": {"profit": 100}},
    ]

    response = client.post("/calculate_utility", json={"npc": npc, "options": options})
    assert response.status_code == 200
    data = response.json()

    assert data["best_action"]["type"] == "sleep"


def test_calculate_utility_food_security():
    """Test that NPC gathers food if inventory is low"""
    npc = {
        "id": "npc1",
        "name": "TestNPC",
        "needs": {"hunger": 0.1, "energy": 0.9, "social": 0.5},
        "stats": {"health": 100, "money": 10, "speed": 1.0},
        "skills": {"gathering": 10, "crafting": 10, "trading": 10},
        "inventory": [],  # Empty inventory
        "currentAction": None,
        "homeId": None,
    }

    options = [
        {
            "name": "pickup:berry",
            "type": "pickup",
            "params": {"resource_type": "bush_berry", "value": 0.1},
        },
        {
            "name": "pickup:stone",
            "type": "pickup",
            "params": {"resource_type": "rock_stone", "value": 0.1},
        },
    ]

    response = client.post("/calculate_utility", json={"npc": npc, "options": options})
    assert response.status_code == 200
    data = response.json()

    # Should prioritize food (berry) over stone because inventory is empty
    assert data["best_action"]["params"]["resource_type"] == "bush_berry"
