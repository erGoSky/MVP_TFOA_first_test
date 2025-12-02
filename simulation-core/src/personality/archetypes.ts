import { PersonalityTraits } from "../types";

/**
 * Pre-defined personality archetypes for NPCs
 * Each archetype represents a distinct behavioral profile
 */
export const PERSONALITY_ARCHETYPES: Record<string, PersonalityTraits> = {
  merchant: {
    greed: 0.8, // Profit-driven
    laziness: 0.3, // Hardworking
    sociability: 0.7, // Enjoys trading
    riskTolerance: 0.6, // Calculated risks
    planfulness: 0.7, // Plans inventory
    curiosity: 0.4, // Focuses on trade
  },

  hermit: {
    greed: 0.2, // Self-sufficient
    laziness: 0.4, // Works when needed
    sociability: 0.1, // Avoids people
    riskTolerance: 0.3, // Very cautious
    planfulness: 0.6, // Plans for isolation
    curiosity: 0.5, // Explores alone
  },

  builder: {
    greed: 0.5, // Fair pricing
    laziness: 0.2, // Dedicated worker
    sociability: 0.5, // Professional
    riskTolerance: 0.4, // Careful with projects
    planfulness: 0.9, // Highly organized
    curiosity: 0.3, // Focused on craft
  },

  adventurer: {
    greed: 0.4, // Seeks treasure
    laziness: 0.3, // Active lifestyle
    sociability: 0.6, // Shares stories
    riskTolerance: 0.8, // Thrill-seeker
    planfulness: 0.4, // Spontaneous
    curiosity: 0.9, // Explores everything
  },

  farmer: {
    greed: 0.3, // Simple needs
    laziness: 0.2, // Hardworking
    sociability: 0.5, // Community-oriented
    riskTolerance: 0.3, // Cautious
    planfulness: 0.7, // Plans seasons
    curiosity: 0.3, // Routine-focused
  },

  scholar: {
    greed: 0.3, // Knowledge over wealth
    laziness: 0.5, // Sedentary
    sociability: 0.4, // Prefers books
    riskTolerance: 0.2, // Very cautious
    planfulness: 0.8, // Methodical
    curiosity: 0.9, // Insatiably curious
  },

  warrior: {
    greed: 0.5, // Seeks glory and reward
    laziness: 0.2, // Disciplined
    sociability: 0.6, // Camaraderie
    riskTolerance: 0.9, // Fearless
    planfulness: 0.6, // Tactical
    curiosity: 0.5, // Seeks challenges
  },

  artisan: {
    greed: 0.6, // Values craftsmanship
    laziness: 0.3, // Dedicated to craft
    sociability: 0.4, // Focused on work
    riskTolerance: 0.4, // Careful with materials
    planfulness: 0.8, // Meticulous
    curiosity: 0.6, // Innovative
  },
};

/**
 * Get list of all available archetypes
 */
export function getArchetypeNames(): string[] {
  return Object.keys(PERSONALITY_ARCHETYPES);
}

/**
 * Get archetype by name
 */
export function getArchetype(name: string): PersonalityTraits | null {
  return PERSONALITY_ARCHETYPES[name] || null;
}
