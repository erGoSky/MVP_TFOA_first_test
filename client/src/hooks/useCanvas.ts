import { useEffect, useState, useRef } from 'react';
import type { WorldState, Entity, NPC } from '../types/world';
import { useEntityVisuals } from './useEntityVisuals';
import { useMetadata } from '../context/MetadataContext';

export interface CanvasTransform {
  scale: number;
  offset: { x: number; y: number };
}

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  worldState: WorldState | null,
  onHover: (entities: Entity[], x: number, y: number) => void,
  transform: CanvasTransform,
  onTransformChange: (newTransform: CanvasTransform) => void
) {
  const TILE_SIZE = 32;

  // Use metadata hooks
  const { getEntitySymbol, getEntityColor } = useEntityVisuals();
  const { biomeMetadata } = useMetadata();

  // Internal state for dragging
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle resizing
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(transform.offset.x, transform.offset.y);
    ctx.scale(transform.scale, transform.scale);
    
    // Draw Terrain
    if (worldState.tiles && worldState.tiles.length > 0) {
        const startX = Math.floor(-transform.offset.x / transform.scale / TILE_SIZE);
        const startY = Math.floor(-transform.offset.y / transform.scale / TILE_SIZE);
        const endX = startX + (canvas.width / transform.scale / TILE_SIZE) + 1;
        const endY = startY + (canvas.height / transform.scale / TILE_SIZE) + 1;

        // Hardcoded biome colors as fallback
        const BIOME_FALLBACKS: Record<string, string> = {
          forest: '#2E8B57',
          plains: '#90EE90',
          desert: '#F4A460',
          mountain: '#808080',
          swamp: '#556B2F',
          water: '#4169E1',
        };

        for (let y = Math.max(0, startY); y < Math.min(worldState.height || 100, endY); y++) {
            for (let x = Math.max(0, startX); x < Math.min(worldState.width || 100, endX); x++) {
                const tile = worldState.tiles[y]?.[x];
                if (tile) {
                    const biomeData = biomeMetadata?.[tile.biome];
                    const color = biomeData?.color || BIOME_FALLBACKS[tile.biome] || '#1a1a2e';
                    ctx.fillStyle = color;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Calculate visible grid area to optimize rendering
    const startX = Math.floor(-transform.offset.x / transform.scale / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(-transform.offset.y / transform.scale / TILE_SIZE) * TILE_SIZE;
    const endX = startX + (canvas.width / transform.scale) + TILE_SIZE;
    const endY = startY + (canvas.height / transform.scale) + TILE_SIZE;

    // Vertical lines
    for (let x = startX; x <= endX; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw Entities
    const entities = [
      ...Object.values(worldState.resources),
      ...Object.values(worldState.buildings),
      ...Object.values(worldState.npcs)
    ];

    entities.forEach(entity => {
      const x = entity.position.x * TILE_SIZE;
      const y = entity.position.y * TILE_SIZE;

      // Draw entity background
      ctx.fillStyle = getEntityColor(entity);
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw entity symbol
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getEntitySymbol(entity), x + TILE_SIZE / 2, y + TILE_SIZE / 2);

      // Draw status indicators
      if (entity.type === 'npc') {
        const npc = entity as NPC;
        if (npc.currentAction) {
          const actionType = npc.currentAction.split(':')[0];
          const icons: Record<string, string> = {
            'move': '🚶', 'chop': '🪓', 'mine': '⛏️', 'craft': '🔨',
            'sleep': '😴', 'eat': '🍖', 'work': '💼', 'sell': '💰', 'buy': '🛒'
          };
          const icon = icons[actionType] || '❓';
          
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(icon, x + TILE_SIZE / 2, y - 2);
        }
      } else if (entity.type === 'resource') {
        const res = entity as any;
        if (res.amount < 5) {
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('⚠️', x + TILE_SIZE, y);
        }
      } else if (entity.type === 'building') {
        const b = entity as any;
        if (b.inventory && b.inventory.length > 0) {
           ctx.font = '10px Arial';
           ctx.textAlign = 'right';
           ctx.textBaseline = 'top';
           ctx.fillText('📦', x + TILE_SIZE, y);
        }
      }
    });

    // Restore context state
    ctx.restore();

  }, [worldState, canvasRef, transform, windowSize]);

  // Handle mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const screenToWorld = (screenX: number, screenY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - transform.offset.x) / transform.scale;
      const y = (screenY - rect.top - transform.offset.y) / transform.scale;
      return { x, y };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, transform.scale + delta), 5);

      // Zoom towards mouse pointer
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - transform.offset.x) / transform.scale;
      const worldY = (mouseY - transform.offset.y) / transform.scale;

      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;

      onTransformChange({ scale: newScale, offset: { x: newOffsetX, y: newOffsetY } });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        onTransformChange({
          scale: transform.scale,
          offset: {
            x: transform.offset.x + deltaX,
            y: transform.offset.y + deltaY
          }
        });

        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }

      if (!worldState) return;

      const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);
      const gridX = Math.floor(worldX / TILE_SIZE);
      const gridY = Math.floor(worldY / TILE_SIZE);

      // Find entities at this position
      const entitiesAtPos: Entity[] = [];
      
      const checkEntity = (entity: Entity) => {
        const entX = Math.floor(entity.position.x);
        const entY = Math.floor(entity.position.y);
        if (entX === gridX && entY === gridY) {
          entitiesAtPos.push(entity);
        }
      };

      Object.values(worldState.npcs).forEach(checkEntity);
      Object.values(worldState.resources).forEach(checkEntity);
      Object.values(worldState.buildings).forEach(checkEntity);

      onHover(entitiesAtPos, e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        isDragging.current = false;
      }, 0);
    };

    const handleClick = (e: MouseEvent) => {
      // Only center if not dragging
      if (isDragging.current) return;

      const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);
      
      // Center the view on the clicked point
      const newOffsetX = canvas.width / 2 - worldX * transform.scale;
      const newOffsetY = canvas.height / 2 - worldY * transform.scale;

      onTransformChange({
        scale: transform.scale,
        offset: { x: newOffsetX, y: newOffsetY }
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [worldState, canvasRef, onHover, transform]);
}
