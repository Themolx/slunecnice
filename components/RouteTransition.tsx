"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Flashes a white blur over the viewport on route change, so navigating between
 * screens feels like a soft wipe rather than an instant cut.
 */
export default function RouteTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 30);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        pointerEvents: "none",
        background: "var(--bg)",
        opacity: active ? 1 : 0,
        backdropFilter: active ? "blur(10px)" : "blur(0px)",
        WebkitBackdropFilter: active ? "blur(10px)" : "blur(0px)",
        // quick fade-in to white, slower fade-out revealing the new screen
        transition: active
          ? "opacity 0.10s ease-out, backdrop-filter 0.10s ease-out"
          : "opacity 0.42s ease-in, backdrop-filter 0.42s ease-in",
      }}
    />
  );
}
