/**
 * @fileoverview Core type definitions for the simulation.
 *
 * This file contains all fundamental type definitions including:
 * - Vector2: 2D position vectors
 * - Needs, Stats, Skills: NPC attributes
 * - Entity types: NPC, Resource, Building
 * - Inventory and container systems
 * - World state structures
 */

/** 2D position vector */
export interface Vector2 {
  x: number;
  y: number;
}

/** NPC needs that drive behavior (0-1 scale) */
export interface Needs {
  hunger: number; // 0 = full, 1 = starving
  energy: number; // 0 = exhausted, 1 = rested
  social: number; // 0 = lonely, 1 = satisfied
}

/** NPC statistics */
export interface Stats {
  health: number;
  money: number;
  speed: number;
}

/** Item storage category affecting how it can be stored */
export type ItemCategory = "liquid" | "bulky" | "small" | "loose";

/** Physical and quality properties of items */
export interface ItemProperties {
  volume?: number;
  weight?: number;
  quality?: number;
  durability?: number;
  maxDurability?: number;
  freshness?: number;
}

/** Physical properties of entities in the world */
export interface EntityProperties {
  blocksMovement: boolean;
  canBeInInventory: boolean;
  canBeInContainer: boolean;
  size: { width: number; height: number };
}

/** Tracks NPC contribution to work progress */
export interface WorkContributor {
  npcId: string;
  lastContribution: number;
  totalContribution: number;
}

/** Progress tracking for multi-tick actions */
export interface WorkProgress {
  currentProgress: number;
  requiredProgress: number;
  actionType: string;
  contributors: WorkContributor[];
  lastContributorId?: string;
  baseProgressPerTick: number;
}

/** Item in inventory or container */
export interface InventoryItem {
  id: string;
  type: string;
  quantity: number;
  category?: ItemCategory;
  properties?: ItemProperties;
  contents?: InventoryItem[];
}

/** Storage container component */
export interface Container {
  capacity: number;
  contents: InventoryItem[];
  isOpen: boolean;
}

/** Base entity interface for all world objects */
export interface Entity {
  id: string;
  type: "npc" | "resource" | "building";
  position: Vector2;
  container?: Container;
}

// Import centralized entity types
import type { BiomeType, ResourceType } from "./constants/entities";
export type { BiomeType, ResourceType };
