import { useState } from "react";
import { cn } from "./cn";

/**
 * TOOLTIP - Dica de contexto ao hover
 * Posicionamento: top, bottom, left, right
 * Aparece ao hover/focus, desaparece ao blur
 */

const positionStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent",
};

export function Tooltip({
  content,
  position = "top",
  children,
  className,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      
      {visible && content && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none",
            positionStyles[position],
            className
          )}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowStyles[position]
            )}
          />
        </div>
      )}
    </div>
  );
}
