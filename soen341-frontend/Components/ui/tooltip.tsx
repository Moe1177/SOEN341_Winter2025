"use client";

import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs whitespace-nowrap
            ${side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-1" : ""}
            ${side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-1" : ""}
            ${side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-1" : ""}
            ${side === "right" ? "left-full top-1/2 -translate-y-1/2 ml-1" : ""}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// Re-export for API compatibility
export const TooltipProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => <>{children}</>;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const TooltipContent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
