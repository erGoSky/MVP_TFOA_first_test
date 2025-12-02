import React, { useState, useRef, useEffect } from "react";
import "./Tooltip.scss";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  position?: "top" | "bottom" | "left" | "right" | "auto";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 500,
  position = "auto",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom" | "left" | "right">(
    position === "auto" ? "top" : position
  );
  const timeoutRef = useRef<number | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && position === "auto" && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Determine best position
      let bestPosition: "top" | "bottom" | "left" | "right" = "top";

      // Check if there's space above
      if (triggerRect.top - tooltipRect.height < 0) {
        bestPosition = "bottom";
      }
      // Check if there's space below
      if (triggerRect.bottom + tooltipRect.height > viewportHeight) {
        bestPosition = "top";
      }
      // Check if there's space on right
      if (triggerRect.right + tooltipRect.width > viewportWidth) {
        bestPosition = "left";
      }
      // Check if there's space on left
      if (triggerRect.left - tooltipRect.width < 0) {
        bestPosition = "right";
      }

      setTooltipPosition(bestPosition);
    }
  }, [isVisible, position]);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={triggerRef}
    >
      {children}
      {isVisible && (
        <div ref={tooltipRef} className={`tooltip tooltip-${tooltipPosition}`}>
          {content}
        </div>
      )}
    </div>
  );
};
