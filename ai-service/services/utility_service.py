import os

DEBUG_MODE = os.getenv("DEBUG_SINGLE_NPC") == "true"


class UtilityService:
    def calculate_utility(self, data):
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

        if DEBUG_MODE:
            print(f"--- Utility Calculation for {data.npc.name} ---")
            print(f"Needs: Hunger={data.npc.needs.hunger}, Energy={data.npc.needs.energy}")
            print(f"Inventory: {inventory_map}")

        for action in data.options:
            u_needs = 0.0
            u_economic = 0.0
            u_risk = 0.0

            # 1. Needs Utility
            if action.type == "gather":
                # Gathering food reduces hunger risk
                if action.target in ["bush_berry", "tree_apple", "wild_wheat"]:
                    if data.npc.needs.hunger > 50 or food_count < food_threshold:
                        u_needs += 0.8
                    else:
                        u_needs += 0.2  # Stockpile
                elif action.target in ["tree_oak", "rock_iron"]:
                    # Gathering resources for money/crafting
                    u_economic += 0.5

            elif action.type == "eat":
                if data.npc.needs.hunger > 30:
                    u_needs += 1.0
                else:
                    u_needs -= 0.5  # Don't eat if not hungry

            elif action.type == "sleep":
                if data.npc.needs.energy < 30:
                    u_needs += 1.0
                else:
                    u_needs -= 0.5

            elif action.type == "move":
                u_needs -= 0.1  # Cost of movement

            elif action.type == "idle":
                u_needs -= 0.2  # Idle is generally bad unless waiting

            # 2. Economic Utility (Simplified)
            # If we have a lot of something, gathering more is less useful
            if action.type == "gather":
                current_qty = inventory_map.get(action.target, 0)
                if current_qty > 10:
                    u_economic -= 0.3

            # 3. Risk Utility
            # Distance penalty
            dist = abs(action.position.x - data.npc.position.x) + abs(
                action.position.y - data.npc.position.y
            )
            u_risk -= dist * 0.01

            # Total Utility
            total_utility = (u_needs * w_needs) + (u_economic * w_economic) + (u_risk * w_risk)

            if DEBUG_MODE:
                print(
                    f"Action: {action.type} ({action.target}) -> U={total_utility:.2f} (N={u_needs:.2f}, E={u_economic:.2f}, R={u_risk:.2f})"
                )

            if total_utility > max_utility:
                max_utility = total_utility
                best_action = action

        if DEBUG_MODE:
            print(
                f"Best Action: {best_action.type if best_action else 'None'} with U={max_utility:.2f}"
            )
            print("-------------------------------------------")

        return best_action
