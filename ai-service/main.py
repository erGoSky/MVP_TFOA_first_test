import logging
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, Field

from goap import Action, GOAPPlanner
from planning.debugger import PlanningDebugger
from services.planning_service import PlanningService
from services.utility_service import UtilityService

# Disable uvicorn access logs
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

app = FastAPI()

# Initialize services
utility_service = UtilityService()
planning_service = PlanningService()
debugger = PlanningDebugger()


# Global exception handler to ensure fail-fast in debug mode
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ CRITICAL ERROR: {exc}")
    import sys

    sys.exit(1)


# --- Models ---


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
    personality: Optional[Dict[str, Any]] = {}


class UtilityRequest(BaseModel):
    npc: NPCState
    options: List[ActionOption]


class EnhancedPlanRequest(BaseModel):
    npc_state: Dict[str, Any]
    goal: Dict[str, Any]
    world_state: Dict[str, Any]


class PlanRequest(BaseModel):
    start_state: Dict[str, Any]
    goal_state: Dict[str, Any]
    available_actions: List[Dict[str, Any]]


# --- Endpoints ---


@app.get("/")
def read_root():
    return {"message": "TFOA AI Service is running"}


@app.post("/calculate_utility")
def calculate_utility(data: UtilityRequest):
    return utility_service.calculate_utility(data)


@app.post("/plan_action_enhanced")
def plan_action_enhanced(data: EnhancedPlanRequest):
    return planning_service.plan_action_enhanced(data)


@app.post("/plan_action")
def plan_action(data: PlanRequest):
    """
    Basic GOAP planning endpoint (legacy).
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


# --- Debug Endpoints ---


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
