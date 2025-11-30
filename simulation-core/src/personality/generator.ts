import { Personality, PersonalityTraits, NPCContext, NPCContextState } from '../types';
import { PERSONALITY_ARCHETYPES } from './archetypes';

/**
 * Utility weights for decision-making
 */
export interface UtilityWeights {
  needs: number;      // Survival actions (eat, sleep)
  economic: number;   // Wealth-building (work, trade)
  social: number;     // Interactions (chat, cooperate)
}

/**
 * Generates and manages NPC personalities
 */
export class PersonalityGenerator {
  /**
   * Generate a personality from an archetype or random
   * @param archetype Optional archetype name (e.g., "merchant")
   * @returns Complete Personality object
   */
  static generate(archetype?: string): Personality {
    if (archetype && PERSONALITY_ARCHETYPES[archetype]) {
      return this.generateFromArchetype(archetype);
    }
    return this.generateRandom();
  }

  /**
   * Generate personality from archetype with ±10% variation
   */
  private static generateFromArchetype(archetype: string): Personality {
    const template = PERSONALITY_ARCHETYPES[archetype];
    const traits: PersonalityTraits = {
      greed: 0,
      laziness: 0,
      sociability: 0,
      riskTolerance: 0,
      planfulness: 0,
      curiosity: 0
    };

    // Add ±10% variation to each trait
    for (const key of Object.keys(template) as Array<keyof PersonalityTraits>) {
      const baseValue = template[key];
      const variation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
      traits[key] = Math.max(0, Math.min(1, baseValue + variation));
    }

    return {
      traits,
      archetype
    };
  }

  /**
   * Generate random balanced personality
   */
  private static generateRandom(): Personality {
    const traits: PersonalityTraits = {
      greed: Math.random(),
      laziness: Math.random(),
      sociability: Math.random(),
      riskTolerance: Math.random(),
      planfulness: Math.random(),
      curiosity: Math.random()
    };

    return {
      traits,
      archetype: 'random'
    };
  }

  /**
   * Calculate utility weights based on personality and context
   * Implements 60% human-like (personality-driven) + 40% optimal (context-driven)
   */
  static getUtilityWeights(personality: Personality, context: NPCContext): UtilityWeights {
    const traits = personality.traits;

    // Base weights (balanced)
    let needs = 0.5;
    let economic = 0.3;
    let social = 0.2;

    // Personality modifiers (60% human-like)
    economic += traits.greed * 0.3;          // Greedy NPCs focus on money
    needs -= traits.greed * 0.2;             // At expense of needs

    social += traits.sociability * 0.3;      // Social NPCs seek interaction
    needs -= traits.sociability * 0.1;

    economic -= traits.laziness * 0.2;       // Lazy NPCs avoid work
    needs += traits.laziness * 0.1;          // Prefer rest

    // Context overrides (40% optimal - survival trumps personality)
    if (context.state === NPCContextState.DESPERATE) {
      needs = 0.9;
      economic = 0.1;
      social = 0.0;
    } else if (context.state === NPCContextState.STRUGGLING) {
      needs = 0.7;
      economic = 0.2;
      social = 0.1;
    } else if (context.state === NPCContextState.THRIVING) {
      // Thriving NPCs can afford to be more social
      needs = 0.2;
      economic = 0.3;
      social = 0.5;
    }

    // Normalize to sum to 1.0
    const total = needs + economic + social;
    return {
      needs: needs / total,
      economic: economic / total,
      social: social / total
    };
  }

  /**
   * Get personality description for debugging/display
   */
  static describe(personality: Personality): string {
    const traits = personality.traits;
    const descriptions: string[] = [];

    if (traits.greed > 0.7) descriptions.push('greedy');
    else if (traits.greed < 0.3) descriptions.push('altruistic');

    if (traits.laziness > 0.7) descriptions.push('lazy');
    else if (traits.laziness < 0.3) descriptions.push('hardworking');

    if (traits.sociability > 0.7) descriptions.push('social');
    else if (traits.sociability < 0.3) descriptions.push('reclusive');

    if (traits.riskTolerance > 0.7) descriptions.push('risk-taking');
    else if (traits.riskTolerance < 0.3) descriptions.push('cautious');

    if (traits.planfulness > 0.7) descriptions.push('strategic');
    else if (traits.planfulness < 0.3) descriptions.push('spontaneous');

    if (traits.curiosity > 0.7) descriptions.push('curious');
    else if (traits.curiosity < 0.3) descriptions.push('routine-focused');

    return descriptions.length > 0 
      ? descriptions.join(', ') 
      : 'balanced';
  }
}
