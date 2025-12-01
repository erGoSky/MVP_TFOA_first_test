// Item Durability Constants

export const ITEM_DURABILITY: Record<string, number> = {
  // Tools
  'wooden_pickaxe': 50,
  'wooden_axe': 50,
  'stone_pickaxe': 100,
  'iron_pickaxe': 250,
  'iron_sword': 200,
  'iron_armor': 500,
  
  // Other items
  'water_flask': 10, // Reusable?
};

export const TOOL_DEGRADATION = {
  CHOP: 1,
  MINE: 1,
  CRAFT: 1, // Using a hammer/tool to craft
  ATTACK: 2,
};
