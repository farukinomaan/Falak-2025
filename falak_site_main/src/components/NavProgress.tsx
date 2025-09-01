"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function isModifiedEvent(event: MouseEvent): boolean {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
  event.button === 1
  );
}

export default function NavProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const clearTimerRef = useRef<number | null>(null);
  const guardTimerRef = useRef<number | null>(null);
  const lastPathRef = useRef<string | null>(pathname);

  // Listen for link clicks to start the overlay
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (isModifiedEvent(e)) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      // External links or special cases should be ignored
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      )
        return;
      try {
        const url = new URL(anchor.href, location.href);
        const current = new URL(location.href);
        const isSameOrigin = url.origin === current.origin;
        const isHashChangeOnly =
          isSameOrigin && url.pathname === current.pathname && url.hash !== current.hash;
        if (!isSameOrigin || isHashChangeOnly) return;
        if (url.href === current.href) return;
        // Start overlay
        setIsNavigating(true);
        // Failsafe: auto-clear after 8s to avoid being stuck
        if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current);
        guardTimerRef.current = window.setTimeout(() => {
          setIsNavigating(false);
        }, 8000);
      } catch {
        // ignore
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // When the pathname updates, hide the overlay shortly after
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current);
      }, 200); // small delay to avoid flicker on very fast transitions
    }
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 left-0 h-0.5 w-full overflow-hidden">
        <div className="h-full w-1/3 animate-[loader_1s_ease_infinite] bg-black dark:bg-white" />
      </div>
      
      <style jsx>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

