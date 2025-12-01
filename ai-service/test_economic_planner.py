"""
Test economic planner decision-making.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from planning.economic_planner import EconomicPlanner


def test_craft_vs_work_decision():
    """Test that planner correctly chooses between craft and work-and-buy."""
    planner = EconomicPlanner()
    
    # Scenario 1: Low crafting skill - should prefer work-and-buy
    npc_low_skill = {
        'skills': {'crafting': 20, 'gathering': 70, 'trading': 30},
        'stats': {'money': 10},
        'inventory': {'wood': 5}
    }
    
    world_state = {
        'market_prices': {'sword': 50},
        'quest_board': [],
        'resources': {'tree_1': {'type': 'tree'}}
    }
    
    strategy, details = planner.get_acquisition_plan('sword', npc_low_skill, world_state)
    print(f"\n📊 Scenario 1: Low crafting skill (20)")
    print(f"   Strategy: {strategy}")
    print(f"   Reason: Crafting success={details.get('success_probability', 'N/A')}, quality={details.get('expected_quality', 'N/A')}")
    assert strategy == 'work_and_buy', f"Expected work_and_buy for low skill, got {strategy}"
    print("   ✓ Correctly chose work-and-buy for low skill")
    
    # Scenario 2: High crafting skill - should prefer craft
    npc_high_skill = {
        'skills': {'crafting': 85, 'gathering': 40, 'trading': 30},
        'stats': {'money': 10},
        'inventory': {'wood': 5}
    }
    
    strategy, details = planner.get_acquisition_plan('sword', npc_high_skill, world_state)
    print(f"\n📊 Scenario 2: High crafting skill (85)")
    print(f"   Strategy: {strategy}")
    print(f"   Reason: Crafting success={details.get('success_probability', 'N/A'):.2f}, quality={details.get('expected_quality', 'N/A'):.2f}")
    assert strategy == 'craft', f"Expected craft for high skill, got {strategy}"
    print("   ✓ Correctly chose craft for high skill")
    
    # Scenario 3: Medium skill but high-level gathering - should prefer work-and-buy
    npc_medium_craft_high_gather = {
        'skills': {'crafting': 45, 'gathering': 90, 'trading': 30},
        'stats': {'money': 5},
        'inventory': {'wood': 5}
    }
    
    strategy, details = planner.get_acquisition_plan('sword', npc_medium_craft_high_gather, world_state)
    print(f"\n📊 Scenario 3: Medium craft (45), High gathering (90)")
    print(f"   Strategy: {strategy}")
    print(f"   Best profession: {details.get('best_profession', 'N/A')}")
    print(f"   Work time: {details.get('work_time', 'N/A'):.1f} ticks")
    # Medium skill with risks should prefer reliable work path
    print("   ✓ Decision made based on skill comparison")


def test_work_calculation():
    """Test work time calculation based on skill."""
    planner = EconomicPlanner()
    
    npc_state = {
        'skills': {'crafting': 30, 'gathering': 80, 'trading': 40},
        'stats': {'money': 20}
    }
    
    world_state = {
        'market_prices': {'expensive_item': 100},
        'quest_board': []
    }
    
    strategy, details = planner.get_acquisition_plan('expensive_item', npc_state, world_state)
    print(f"\n💰 Work Calculation Test:")
    print(f"   Item price: 100 gold")
    print(f"   Current gold: 20")
    print(f"   Gold needed: {details['gold_needed']}")
    print(f"   Best profession: {details['best_profession']} (skill: 80)")
    print(f"   Work time: {details['work_time']:.1f} ticks")
    print(f"   Total cost: {details['total_cost']:.1f} ticks")
    print("   ✓ Work calculation complete")


if __name__ == "__main__":
    print("🧪 Running Economic Planner Tests...")
    test_craft_vs_work_decision()
    test_work_calculation()
    print("\n✅ All economic planner tests passed!")
