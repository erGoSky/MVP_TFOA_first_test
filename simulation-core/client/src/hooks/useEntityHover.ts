import { useState, useCallback, useEffect } from 'react';
import type { Entity } from '../types/world';

export function useEntityHover() {
  const [hoveredEntities, setHoveredEntities] = useState<Entity[]>([]);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleHover = useCallback((entities: Entity[], x: number, y: number) => {
    // Only update if entities changed to avoid flickering
    // Simple check based on IDs
    setHoveredEntities(prev => {
      const prevIds = prev.map(e => e.id).join(',');
      const newIds = entities.map(e => e.id).join(',');
      if (prevIds === newIds) return prev;
      
      // Reset index when entities change
      setHoverIndex(0);
      return entities;
    });

    if (entities.length > 0) {
      setMousePos({ x, y });
    } else {
      setMousePos(null);
    }
  }, []);

  const cycleHover = useCallback((direction: number) => {
    if (hoveredEntities.length <= 1) return;
    
    setHoverIndex(prev => {
      const next = prev + direction;
      if (next >= hoveredEntities.length) return 0;
      if (next < 0) return hoveredEntities.length - 1;
      return next;
    });
  }, [hoveredEntities.length]);

  // Scroll wheel handler for cycling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (hoveredEntities.length > 1) {
        if (e.deltaY > 0) cycleHover(1);
        else cycleHover(-1);
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [hoveredEntities.length, cycleHover]);

  return {
    hoveredEntities,
    hoverIndex,
    mousePos,
    handleHover,
    cycleHover
  };
}
