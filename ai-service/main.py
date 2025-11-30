from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import uvicorn
import numpy as np
from goap import GOAPPlanner, Action
import logging

# Disable uvicorn access logs
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

app = FastAPI()

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
    currentAction: Optional[str]
    homeId: Optional[str] = None

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
    W_NEEDS = 0.6
    W_ECONOMIC = 0.4
    W_RISK = 0.2

    # Analyze Inventory
    food_count = 0
    inventory_map = {}
    for item in data.npc.inventory:
        # Simple heuristic: berries, apples, bread are food
        if item['type'] in ['bush_berry', 'tree_apple', 'bread', 'mushroom_red', 'mushroom_brown', 'wild_wheat', 'flower_honey']:
            food_count += item['quantity']
        
        inventory_map[item['type']] = inventory_map.get(item['type'], 0) + item['quantity']

    FOOD_THRESHOLD = 3

    for action in data.options:
        u_needs = 0.0
        u_economic = 0.0
        u_risk = 0.0

        # 1. Needs Utility
        # Hunger
        if data.npc.needs.hunger > 0.7:
             if action.type == 'eat':
                 u_needs += 2.0
             elif action.type == 'buy' and action.params.get('item') == 'bread':
                 u_needs += 1.5
        
        # Energy
        if data.npc.needs.energy < 0.3:
            if action.type == 'sleep':
                u_needs += 2.0
        
        # 2. Economic & Stockpiling Utility
        if action.type == 'work':
            profit = action.params.get('profit', 0)
            u_economic += min(profit / 100.0, 1.0) * 0.5
        
        elif action.type == 'pickup':
            # Gathering food is high priority if low on food
            res_type = action.params.get('resource_type', '')
            is_food = res_type in ['bush_berry', 'tree_apple', 'wild_wheat', 'mushroom_red', 'mushroom_brown']
            
            val = action.params.get('value', 0.1)
            u_economic += val

            if is_food and food_count < FOOD_THRESHOLD:
                u_needs += 0.5 # Boost for food security

        elif action.type == 'craft':
            u_economic += action.params.get('value', 0.5)

        elif action.type == 'sell':
            item_type = action.params.get('item', '')
            count = inventory_map.get(item_type, 0)
            
            # Only sell if we have surplus or it's not food
            is_food = item_type in ['bush_berry', 'tree_apple', 'bread']
            
            if is_food:
                if count > FOOD_THRESHOLD:
                    u_economic += action.params.get('value', 0.5) * 1.5 # Good to sell surplus
                else:
                    u_economic -= 0.5 # Don't sell last food!
            else:
                # Non-food items are good to sell
                u_economic += action.params.get('value', 0.5)

        elif action.type == 'buy':
            item_type = action.params.get('item', '')
            is_food = item_type in ['bread', 'tree_apple', 'bush_berry']
            
            cost_penalty = 0.2
            if data.npc.stats.money < 10:
                cost_penalty = 0.5 # Be careful with money if poor

            u_economic -= cost_penalty

        # 4. Housing Logic
        # If homeless and rich, build a house
        if action.type == 'create_contract' and not data.npc.homeId and data.npc.stats.money >= 100:
            u_economic += 0.8
            
        # If tired, prioritize sleeping at home
        if action.type == 'sleep':
            if data.npc.needs.energy < 0.3:
                 u_needs += 0.8
            
        if action.type == 'move':
            target = action.params.get('target')
            # If tired and moving to home
            if data.npc.homeId and target == data.npc.homeId and data.npc.needs.energy < 0.4:
                u_needs += 0.9

        # 5. Builder Logic
        if action.type == 'build_step':
            # High utility to finish the job and get paid
            u_economic += 2.0 
            
        # If we are buying/gathering materials for a contract
        is_building_mat = action.params.get('item', '') in ['wall_stone', 'wall_log', 'door_plank', 'roof_hay', 'roof_leaf', 'rock_stone', 'tree_oak'] or \
                          action.params.get('resource_type', '') in ['rock_stone', 'tree_oak', 'tree_pine']
                          
        if is_building_mat:
             if data.npc.stats.money > 50: # Likely have prepayment
                 u_economic += 0.6

        # Calculate Total Utility
        total_utility = (u_needs * W_NEEDS) + (u_economic * W_ECONOMIC) - (u_risk * W_RISK)
        
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
        print(f"🤖 [{npc_name}] H:{hunger:.2f} E:{energy:.2f} $:{money} Inv:{inventory_count} → {best_action.name} (U={max_utility:.2f})")
    else:
        print(f"⚠️  [{npc_name}] No valid action found! H:{hunger:.2f} E:{energy:.2f} $:{money}")

    return {"best_action": best_action, "utility": max_utility}


# GOAP Integration
class PlanRequest(BaseModel):
    start_state: Dict[str, Any]
    goal_state: Dict[str, Any]
    available_actions: List[Dict[str, Any]] # List of {name, preconditions, effects, cost}

@app.post("/plan_action")
def plan_action(data: PlanRequest):
    # Convert dict actions to Action objects
    actions = []
    for a in data.available_actions:
        actions.append(Action(
            name=a['name'],
            preconditions=a['preconditions'],
            effects=a['effects'],
            cost=a.get('cost', 1.0)
        ))
    
    planner = GOAPPlanner(actions)
    plan = planner.plan(data.start_state, data.goal_state)
    
    return {"plan": plan}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
