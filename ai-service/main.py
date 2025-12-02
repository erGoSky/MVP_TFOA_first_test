import logging
from typing import Any, Dict, List, Optional

import numpy as np
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, Field

from goap import Action, GOAPPlanner
from planning.action_registry import registry as action_registry
from planning.debugger import PlanningDebugger
from planning.economic_planner import EconomicPlanner
from planning.types import Goal, GoalType

# Disable uvicorn access logs
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

app = FastAPI()


# Global exception handler to ensure fail-fast in debug mode
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ CRITICAL ERROR: {exc}")
    import sys

    sys.exit(1)


class Needs(BaseModel):
    hunger: float
    energy: float
    social: float


class Stats(BaseModel):
    health: float
    money: float


class ActionOption(BaseModel):
    name: str
    type: str
    params: Dict[str, Any]


class NPCState(BaseModel):
    id: str
    name: str
    needs: Needs
    stats: Stats
    skills: Dict[str, float]
    inventory: List[Dict[str, Any]]
    current_action: Optional[str] = Field(None, alias="currentAction")
    home_id: Optional[str] = Field(None, alias="homeId")


class UtilityRequest(BaseModel):
    npc: NPCState
    options: List[ActionOption]


@app.get("/")
def read_root():
    return {"message": "TFOA AI Service is running"}


@app.post("/calculate_utility")
def calculate_utility(data: UtilityRequest):
    best_action = None
    max_utility = -1000.0

    # Weights
    w_needs = 0.6
    w_economic = 0.4
    w_risk = 0.2

    # Analyze Inventory
    food_count = 0
    inventory_map = {}
    for item in data.npc.inventory:
        # Simple heuristic: berries, apples, bread are food
        if item["type"] in [
            "bush_berry",
            "tree_apple",
            "bread",
            "mushroom_red",
            "mushroom_brown",
            "wild_wheat",
            "flower_honey",
        ]:
            food_count += item["quantity"]

        inventory_map[item["type"]] = inventory_map.get(item["type"], 0) + item["quantity"]

    food_threshold = 3

    for action in data.options:
        u_needs = 0.0
        u_economic = 0.0
        u_risk = 0.0

        # 1. Needs Utility
        # Hunger
        if data.npc.needs.hunger > 0.7:
            if action.type == "eat":
                u_needs += 2.0
            elif action.type == "buy" and action.params.get("item") == "bread":
                u_needs += 1.5

        # Energy
        if data.npc.needs.energy < 0.3 and action.type == "sleep":
            u_needs += 2.0

        # 2. Economic & Stockpiling Utility
        if action.type == "work":
            profit = action.params.get("profit", 0)
            u_economic += min(profit / 100.0, 1.0) * 0.5

        elif action.type == "pickup":
            # Gathering food is high priority if low on food
            res_type = action.params.get("resource_type", "")
            is_food = res_type in [
                "bush_berry",
                "tree_apple",
                "wild_wheat",
                "mushroom_red",
                "mushroom_brown",
            ]

            val = action.params.get("value", 0.1)
            u_economic += val

            if is_food and food_count < food_threshold:
                u_needs += 0.5  # Boost for food security

        elif action.type == "craft":
            u_economic += action.params.get("value", 0.5)

        elif action.type == "sell":
            item_type = action.params.get("item", "")
            count = inventory_map.get(item_type, 0)

            # Only sell if we have surplus or it's not food
            is_food = item_type in ["bush_berry", "tree_apple", "bread"]

            if is_food:
                if count > food_threshold:
                    u_economic += action.params.get("value", 0.5) * 1.5  # Good to sell surplus
                else:
                    u_economic -= 0.5  # Don't sell last food!
            else:
                # Non-food items are good to sell
                u_economic += action.params.get("value", 0.5)

        elif action.type == "buy":
            item_type = action.params.get("item", "")
            is_food = item_type in ["bread", "tree_apple", "bush_berry"]

            cost_penalty = 0.2
            if data.npc.stats.money < 10:
                cost_penalty = 0.5  # Be careful with money if poor

            u_economic -= cost_penalty

        # 4. Housing Logic
        # If homeless and rich, build a house
        if (
            action.type == "create_contract"
            and not data.npc.home_id
            and data.npc.stats.money >= 100
        ):
            u_economic += 0.8

        # If tired, prioritize sleeping at home
        if action.type == "sleep" and data.npc.needs.energy < 0.3:
            u_needs += 0.8

        if action.type == "move":
            target = action.params.get("target")
            # If tired and moving to home
            if data.npc.home_id and target == data.npc.home_id and data.npc.needs.energy < 0.4:
                u_needs += 0.9

        # 5. Builder Logic
        if action.type == "build_step":
            # High utility to finish the job and get paid
            u_economic += 2.0

        # If we are buying/gathering materials for a contract
        is_building_mat = action.params.get("item", "") in [
            "wall_stone",
            "wall_log",
            "door_plank",
            "roof_hay",
            "roof_leaf",
            "rock_stone",
            "tree_oak",
        ] or action.params.get("resource_type", "") in ["rock_stone", "tree_oak", "tree_pine"]

        if is_building_mat and data.npc.stats.money > 50:  # Likely have prepayment
            u_economic += 0.6

        # Calculate Total Utility
        total_utility = (u_needs * w_needs) + (u_economic * w_economic) - (u_risk * w_risk)

        # Add some randomness to break loops
        total_utility += np.random.normal(0, 0.05)

        if total_utility > max_utility:
            max_utility = total_utility
            best_action = action

    # Detailed logging for decision-making
    npc_name = data.npc.name
    hunger = data.npc.needs.hunger
    energy = data.npc.needs.energy
    money = data.npc.stats.money
    inventory_count = len(data.npc.inventory)

    if best_action:
        print(
            f"🤖 [{npc_name}] H:{hunger:.2f} E:{energy:.2f} $:{money} Inv:{inventory_count} → {best_action.name} (U={max_utility:.2f})"
        )
    else:
        print(f"⚠️  [{npc_name}] No valid action found! H:{hunger:.2f} E:{energy:.2f} $:{money}")

    return {"best_action": best_action, "utility": max_utility}


# GOAP Integration
# GOAP Integration
# Imports moved to top


# Initialize Debugger
debugger = PlanningDebugger()


class EnhancedPlanRequest(BaseModel):
    npc_state: Dict[str, Any]  # NPC state (position, inventory, skills, stats)
    goal: Dict[str, Any]  # Goal from TypeScript
    world_state: Dict[str, Any]  # Resources, buildings, quest board, market prices


class PlanRequest(BaseModel):
    start_state: Dict[str, Any]
    goal_state: Dict[str, Any]
    available_actions: List[Dict[str, Any]]  # List of {name, preconditions, effects, cost}


@app.post("/plan_action")
def plan_action(data: PlanRequest):
    """
    Basic GOAP planning endpoint (legacy).
    Use /plan_action_enhanced for full GOAP with economic intelligence.
    """
    # Convert dict actions to Action objects
    actions = []
    for a in data.available_actions:
        actions.append(
            Action(
                name=a["name"],
                preconditions=a["preconditions"],
                effects=a["effects"],
                cost=a.get("cost", 1.0),
            )
        )

    planner = GOAPPlanner(actions)
    plan = planner.plan(data.start_state, data.goal_state)

    return {"plan": plan}


@app.post("/plan_action_enhanced")
def plan_action_enhanced(data: EnhancedPlanRequest):
    """
    Enhanced GOAP planning with economic intelligence.

    Returns complete action sequence to achieve goal.
    TypeScript will execute actions tick-by-tick.
    """
    try:
        # Debug logging
        print(
            f"📥 Received plan request for NPC: {data.npc_state.get('name')} ({data.npc_state.get('id')})"
        )
        print(f"   Goal: {data.goal.get('type')}")

        # Calculate approximate payload size
        resources_count = len(data.world_state.get("resources", []))
        buildings_count = len(data.world_state.get("buildings", []))
        print(f"   World State: {resources_count} resources, {buildings_count} buildings")

        # Extract data
        npc_state = data.npc_state
        goal = data.goal
        world_state_data = data.world_state

        # Get all available actions from registry
        static_actions = action_registry.get_all_actions()
        dynamic_actions = action_registry.expand_actions(npc_state, world_state_data)
        all_actions = static_actions + dynamic_actions

        # Apply personality-based cost modifiers
        personality = npc_state.get("personality", {})
        for action in all_actions:
            # Only apply to static actions or if we implement cost calc for dynamic ones
            # For now, dynamic actions have fixed costs in expand_actions
            if action.name in action_registry._actions:
                action.cost = action_registry.calculate_cost(action.name, personality)

        # Check if goal involves obtaining an item
        goal_type = goal.get("type")
        if goal_type == "obtain_item":
            item = goal.get("item")

            # Use economic planner to decide: craft vs. work-and-buy
            economic_planner = EconomicPlanner()
            strategy, details = economic_planner.get_acquisition_plan(
                item, npc_state, world_state_data
            )

            print(f"📊 Economic decision for {item}: {strategy}")
            print(f"   Details: {details}")

            # Modify goal based on strategy
            if strategy == "work_and_buy":
                # Plan: work to earn gold, then buy
                # We don't need to set gold goal explicitly, the buy action precondition
                # will drive the need for gold.
                goal_state = {f"has_{item}": True}
            else:
                # Plan: craft item
                goal_state = {f"has_{item}": True}
        else:
            # Convert goal conditions to goal_state
            goal_state = {}
            for condition in goal.get("conditions", []):
                goal_state[condition["key"]] = condition["value"]

        # Create start state from NPC state
        start_state = {
            "pos_x": npc_state.get("position", {}).get("x", 0),
            "pos_y": npc_state.get("position", {}).get("y", 0),
            "energy": npc_state.get("needs", {}).get("energy", 1.0),
            "hunger": npc_state.get("needs", {}).get("hunger", 0.0),
            "health": npc_state.get("stats", {}).get("health", 100),
            "gold": npc_state.get("stats", {}).get("money", 0),
        }

        # Add inventory to state
        for item in npc_state.get("inventory", []):
            item_type = item.get("type")
            quantity = item.get("quantity", 0)
            start_state[f"has_{item_type}"] = quantity

        # Add skills to state
        for skill_name, level in npc_state.get("skills", {}).items():
            start_state[f"skill_{skill_name}"] = level

        # Run GOAP planner
        planner = GOAPPlanner(all_actions, max_depth=15)
        plan = planner.plan(start_state, goal_state)

        if not plan:
            return {"success": False, "plan": [], "error": "No plan found to achieve goal"}

        # Validate plan
        is_valid = planner.validate_plan(plan, start_state, goal_state)
        total_cost = planner.get_plan_cost(plan)

        return {
            "success": True,
            "plan": plan,
            "valid": is_valid,
            "total_cost": total_cost,
            "economic_strategy": strategy if goal_type == "obtain_item" else None,
        }

    except Exception as e:
        print(f"❌ Error in plan_action_enhanced: {str(e)}")
        import traceback

        traceback.print_exc()

        # Record failure
        try:
            # Reconstruct goal object for recording
            goal_obj = Goal(
                id=data.goal.get("id", "unknown"),
                type=GoalType(data.goal.get("type", "maintain_need")),
                priority=data.goal.get("priority", 0.0),
                conditions=[],
            )
            debugger.record_plan(
                npc_id=data.npc_state.get("id", "unknown"),
                goal=goal_obj,
                plan=None,
                duration_ms=0,
                success=False,
                error=str(e),
            )
        except Exception:
            pass

        return {"success": False, "plan": [], "error": str(e)}

    # Record success/failure
    try:
        import time

        start_time = time.time()

        # Reconstruct goal object
        goal_obj = Goal(
            id=goal.get("id", "unknown"),
            type=GoalType(goal.get("type", "maintain_need")),
            priority=goal.get("priority", 0.0),
            conditions=[],
        )

        debugger.record_plan(
            npc_id=npc_state.get("id", "unknown"),
            goal=goal_obj,
            plan=plan,
            duration_ms=(time.time() - start_time) * 1000,
            success=bool(plan),
            error="No plan found" if not plan else None,
        )
    except Exception as rec_err:
        print(f"Failed to record plan debug info: {rec_err}")

    return {
        "success": bool(plan),
        "plan": plan if plan else [],
        "valid": is_valid if plan else False,
        "total_cost": total_cost if plan else 0,
        "economic_strategy": strategy if goal_type == "obtain_item" else None,
        "error": "No plan found" if not plan else None,
    }


# Debug Endpoints


@app.get("/debug/npc/{npc_id}/planning")
def get_npc_planning_history(npc_id: str):
    """Get planning history for a specific NPC."""
    return debugger.get_history(npc_id)


@app.get("/debug/npc/{npc_id}/goals")
def get_npc_active_goals(npc_id: str):
    """Get active goals for a specific NPC."""
    return debugger.get_active_goals(npc_id)


@app.get("/debug/stats")
def get_system_stats():
    """Get system-wide planning statistics."""
    return debugger.get_stats()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
