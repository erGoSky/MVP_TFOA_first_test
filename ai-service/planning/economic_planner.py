"""
Economic Planner for GOAP system.

Evaluates different paths to obtain items:
- Craft Path: Fast but risky (quality uncertain, might fail)
- Work-and-Buy Path: Use best skill to earn gold, then buy (slower but reliable)
"""

from typing import Dict, Any, List, Optional, Tuple


class EconomicPlanner:
    """Evaluates economic decisions for item acquisition."""
    
    def __init__(self):
        # Base time costs (in ticks)
        self.BASE_CRAFT_TIME = 10
        self.BASE_WORK_TIME = 20  # Time to earn enough for average item
        
        # Quality thresholds
        self.MIN_SKILL_FOR_QUALITY = 50  # Below this, quality is questionable
    
    def evaluate_craft_path(
        self, 
        item: str, 
        npc_state: Dict[str, Any],
        world_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate crafting an item directly.
        
        Returns:
            {
                'feasible': bool,
                'time_cost': float,
                'success_probability': float,
                'expected_quality': float,
                'total_cost': float,
                'risks': List[str]
            }
        """
        crafting_skill = npc_state.get('skills', {}).get('crafting', 0)
        has_materials = self._check_materials(item, npc_state)
        
        # Calculate success probability based on skill
        success_prob = min(0.95, 0.3 + (crafting_skill / 100) * 0.65)
        
        # Calculate expected quality (0-1 scale)
        expected_quality = min(1.0, crafting_skill / 100)
        
        # Time cost
        skill_modifier = 1.0 - (crafting_skill / 200)  # Higher skill = faster
        time_cost = self.BASE_CRAFT_TIME * skill_modifier
        
        # Identify risks
        risks = []
        if not has_materials:
            risks.append("missing_materials")
            time_cost += 20  # Add time to gather materials
        if crafting_skill < self.MIN_SKILL_FOR_QUALITY:
            risks.append("low_quality_risk")
        if success_prob < 0.7:
            risks.append("high_failure_risk")
        
        # Total cost = time + risk penalty
        risk_penalty = len(risks) * 5
        total_cost = time_cost + risk_penalty
        
        return {
            'feasible': has_materials or self._can_gather_materials(item, world_state),
            'time_cost': time_cost,
            'success_probability': success_prob,
            'expected_quality': expected_quality,
            'total_cost': total_cost,
            'risks': risks
        }
    
    def evaluate_work_and_buy_path(
        self,
        item: str,
        npc_state: Dict[str, Any],
        world_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate working to earn gold, then buying item.
        
        Returns:
            {
                'feasible': bool,
                'time_cost': float,
                'best_profession': str,
                'gold_needed': float,
                'work_time': float,
                'total_cost': float,
                'guaranteed_quality': bool
            }
        """
        # Get market price
        market_prices = world_state.get('market_prices', {})
        item_price = market_prices.get(item, 50)  # Default price
        
        # Check if item is available in market
        item_available = self._check_market_availability(item, world_state)
        
        # Find best profession (highest skill)
        skills = npc_state.get('skills', {})
        best_profession, best_skill = self._get_best_profession(skills)
        
        # Calculate gold earning rate based on best skill
        # Higher skill = earn gold faster
        gold_per_work = 5 + (best_skill / 10)  # Base 5, +0.1 per skill point
        
        # Calculate how many work sessions needed
        current_gold = npc_state.get('stats', {}).get('money', 0)
        gold_needed = max(0, item_price - current_gold)
        work_sessions = gold_needed / gold_per_work if gold_per_work > 0 else float('inf')
        
        # Time cost
        work_time = work_sessions * self.BASE_WORK_TIME
        buy_time = 5  # Time to travel to merchant and buy
        time_cost = work_time + buy_time
        
        # Total cost (no risk penalty - buying is guaranteed)
        total_cost = time_cost
        
        return {
            'feasible': item_available,
            'time_cost': time_cost,
            'best_profession': best_profession,
            'gold_needed': gold_needed,
            'work_time': work_time,
            'total_cost': total_cost,
            'guaranteed_quality': True  # Buying guarantees standard quality
        }
    
    def get_acquisition_plan(
        self,
        item: str,
        npc_state: Dict[str, Any],
        world_state: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Compare both paths and return the optimal strategy.
        
        Returns:
            (strategy, details)
            strategy: 'craft' or 'work_and_buy'
            details: evaluation dict from chosen path
        """
        craft_eval = self.evaluate_craft_path(item, npc_state, world_state)
        work_eval = self.evaluate_work_and_buy_path(item, npc_state, world_state)
        
        # Decision logic
        # Prefer work-and-buy if:
        # 1. Craft has high failure risk (success < 70%)
        # 2. Craft quality is questionable (< 60%)
        # 3. Work path is not significantly slower (< 2x time)
        
        if not craft_eval['feasible']:
            return ('work_and_buy', work_eval)
        
        if not work_eval['feasible']:
            return ('craft', craft_eval)
        
        # Both feasible - compare
        craft_risky = craft_eval['success_probability'] < 0.7
        craft_low_quality = craft_eval['expected_quality'] < 0.6
        time_difference = work_eval['time_cost'] - craft_eval['time_cost']
        time_ratio = work_eval['time_cost'] / max(craft_eval['time_cost'], 1)
        
        # Debug output
        print(f"  [DEBUG] Craft: time={craft_eval['time_cost']:.1f}, success={craft_eval['success_probability']:.2f}, quality={craft_eval['expected_quality']:.2f}, total_cost={craft_eval['total_cost']:.1f}")
        print(f"  [DEBUG] Work: time={work_eval['time_cost']:.1f}, guaranteed=True, total_cost={work_eval['total_cost']:.1f}")
        print(f"  [DEBUG] Time ratio: {time_ratio:.2f}x, Risky: {craft_risky}, Low quality: {craft_low_quality}")
        
        # Priority 1: If craft is very risky (<50% success) or very low quality (<40%), always prefer work-and-buy
        if craft_eval['success_probability'] < 0.5 or craft_eval['expected_quality'] < 0.4:
            print(f"  [DEBUG] → work_and_buy (very risky/low quality)")
            return ('work_and_buy', work_eval)
        
        # Priority 2: If craft is risky or low quality, prefer work-and-buy unless work is >3x slower
        if (craft_risky or craft_low_quality) and time_ratio < 3.0:
            print(f"  [DEBUG] → work_and_buy (risky and work not too slow)")
            return ('work_and_buy', work_eval)
        
        # Priority 3: If craft is reliable (>80% success, >70% quality) and faster, prefer it
        if craft_eval['success_probability'] > 0.8 and craft_eval['expected_quality'] > 0.7:
            if craft_eval['time_cost'] < work_eval['time_cost']:
                print(f"  [DEBUG] → craft (reliable and fast)")
                return ('craft', craft_eval)
        
        # Priority 4: Default to work-and-buy for medium-risk scenarios
        if craft_risky:
            print(f"  [DEBUG] → work_and_buy (default for risky craft)")
            return ('work_and_buy', work_eval)
        
        # Priority 5: Choose lower total cost (includes risk penalties)
        if craft_eval['total_cost'] < work_eval['total_cost']:
            print(f"  [DEBUG] → craft (lower total cost)")
            return ('craft', craft_eval)
        else:
            print(f"  [DEBUG] → work_and_buy (lower total cost)")
            return ('work_and_buy', work_eval)
    
    def _check_materials(self, item: str, npc_state: Dict[str, Any]) -> bool:
        """Check if NPC has materials to craft item."""
        # Simplified - would need recipe database
        inventory = npc_state.get('inventory', {})
        # Example: assume most items need wood or ore
        return inventory.get('wood', 0) > 0 or inventory.get('ore', 0) > 0
    
    def _can_gather_materials(self, item: str, world_state: Dict[str, Any]) -> bool:
        """Check if materials can be gathered from world."""
        resources = world_state.get('resources', {})
        # Simplified check
        return len(resources) > 0
    
    def _check_market_availability(self, item: str, world_state: Dict[str, Any]) -> bool:
        """Check if item is available in market."""
        quest_board = world_state.get('quest_board', [])
        # Check if anyone is selling this item
        for order in quest_board:
            if order.get('type') == 'sell' and order.get('item') == item:
                return True
        return True  # Assume tavern has basic items
    
    def _get_best_profession(self, skills: Dict[str, float]) -> Tuple[str, float]:
        """Find NPC's best skill for earning gold."""
        if not skills:
            return ('gathering', 0)
        
        # Map skills to professions
        profession_skills = {
            'gathering': skills.get('gathering', 0),
            'crafting': skills.get('crafting', 0),
            'trading': skills.get('trading', 0)
        }
        
        best_prof = max(profession_skills.items(), key=lambda x: x[1])
        return best_prof
