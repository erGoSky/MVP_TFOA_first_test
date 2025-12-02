import React, { useRef } from "react";
import type { WorldState, Entity } from "../../types/world";
import { useCanvas } from "../../hooks/useCanvas";
import type { CanvasTransform } from "../../hooks/useCanvas";
import "./WorldCanvas.scss";

interface WorldCanvasProps {
  worldState: WorldState | null;
  onHover: (entities: Entity[], x: number, y: number) => void;
  transform: CanvasTransform;
  onTransformChange: (newTransform: CanvasTransform) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  worldState,
  onHover,
  transform,
  onTransformChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvas(canvasRef, worldState, onHover, transform, onTransformChange);

  return (
    <div className="world-canvas-container">
      <canvas ref={canvasRef} className="world-canvas" />
    </div>
  );
};
