import React from "react";

/**
 * PageTransition - Instant, rock-solid container without remount flashes or opacity dips
 */
export default function PageTransition({ children }) {
  return (
    <div className="w-full flex-1 flex flex-col">
      {children}
    </div>
  );
}
