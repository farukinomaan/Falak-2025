"use client";

import { useEffect, useState } from "react";

export default function BackgroundLayers() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Base background color (immediate) */}
      <div
        className="fixed top-0 left-0 w-full h-full z-[-3]"
        style={{ backgroundColor: "#32212C" }}
        aria-hidden
      />

      {/* SVG background: fade + de-blur on mount to avoid snap */}
      <div
        className={[
          "fixed top-0 left-0 w-full h-full z-[-2] bg-cover bg-center",
          "transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          ready ? "opacity-20 blur-0" : "opacity-0 blur-sm",
        ].join(" ")}
        style={{ backgroundImage: "url('/cultural.svg')", willChange: "opacity, filter" }}
        aria-hidden
      />
    </>
  );
}
