import { FieldChange, EntityChange, FullChangeSet, LimitedChangeSet } from './snapshot.types';
import { Vector2 } from '../types';

export class ChangeTracker {
  private createdEntities: Map<string, EntityChange> = new Map();
  private updatedFields: Map<string, FieldChange[]> = new Map();
  private deletedEntities: Set<string> = new Set();
  
  // For limited cast
  private movedEntities: Map<string, Vector2> = new Map();
  private createdVisibleEntities: Map<string, { type: string; position: Vector2 }> = new Map();

  /**
   * Track entity creation
   */
  trackCreate(id: string, type: string, data: any): void {
    this.createdEntities.set(id, { id, type, data });
    
    // If entity has position, add to limited cast
    if (data.position) {
      this.createdVisibleEntities.set(id, {
        type,
        position: { ...data.position }
      });
    }
  }

  /**
   * Track field-level change
   */
  trackFieldChange(entityId: string, field: string, oldValue: any, newValue: any): void {
    // Skip if values are the same
    if (this.deepEqual(oldValue, newValue)) return;

    const change: FieldChange = {
      entityId,
      field,
      oldValue: this.cloneValue(oldValue),
      newValue: this.cloneValue(newValue)
    };

    if (!this.updatedFields.has(entityId)) {
      this.updatedFields.set(entityId, []);
    }
    this.updatedFields.get(entityId)!.push(change);

    // Track position changes for limited cast
    if (field === 'position' || field.startsWith('position.')) {
      this.movedEntities.set(entityId, this.cloneValue(newValue));
    }
  }

  /**
   * Track entity deletion
   */
  trackDelete(id: string): void {
    this.deletedEntities.add(id);
    
    // Remove from created if it was created this tick
    this.createdEntities.delete(id);
    this.createdVisibleEntities.delete(id);
    this.movedEntities.delete(id);
  }

  /**
   * Generate full change set
   */
  getFullCast(): FullChangeSet {
    const updated: FieldChange[] = [];
    this.updatedFields.forEach((changes) => {
      updated.push(...changes);
    });

    return {
      entities: {
        created: Array.from(this.createdEntities.values()),
        updated,
        deleted: Array.from(this.deletedEntities)
      }
    };
  }

  /**
   * Generate limited change set (visible changes only)
   */
  getLimitedCast(): LimitedChangeSet {
    return {
      entityMoved: Array.from(this.movedEntities.entries()).map(([id, position]) => ({
        id,
        position
      })),
      entityCreated: Array.from(this.createdVisibleEntities.entries()).map(([id, data]) => ({
        id,
        type: data.type,
        position: data.position
      })),
      entityRemoved: Array.from(this.deletedEntities)
    };
  }

  /**
   * Check if there are any changes
   */
  hasChanges(): boolean {
    return this.createdEntities.size > 0 ||
           this.updatedFields.size > 0 ||
           this.deletedEntities.size > 0;
  }

  /**
   * Clear all tracked changes
   */
  clear(): void {
    this.createdEntities.clear();
    this.updatedFields.clear();
    this.deletedEntities.clear();
    this.movedEntities.clear();
    this.createdVisibleEntities.clear();
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }

  /**
   * Clone value to prevent reference issues
   */
  private cloneValue(value: any): any {
    if (value == null) return value;
    if (typeof value !== 'object') return value;
    
    // Simple deep clone for basic objects/arrays
    return JSON.parse(JSON.stringify(value));
  }
}
