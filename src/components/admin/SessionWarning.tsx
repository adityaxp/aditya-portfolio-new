"use client";

import { useEffect, useRef } from "react";

export default function SessionWarning({ seconds }: { seconds: number }) {
  const warning = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = warning.current;
    if (!element) return;
    if (typeof element.showPopover === "function") {
      try {
        element.showPopover();
        return () => { if (element.matches(":popover-open")) element.hidePopover(); };
      } catch {
        // Fall back to a fixed toast when the browser cannot open a popover.
      }
    }
    element.removeAttribute("popover");
  }, []);

  return (
    <div ref={warning} popover="manual" className="admin-session-warning" role="status">
      <span className="admin-session-warning-dot" aria-hidden="true" />
      <span>Session expiring soon</span>
      <strong>{seconds}s</strong>
    </div>
  );
}
