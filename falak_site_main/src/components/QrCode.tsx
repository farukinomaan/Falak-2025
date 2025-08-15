"use client";

import { useEffect, useRef } from "react";

export default function QrCode({ value, size = 128 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QR = await import("qrcode");
        if (!cancelled && ref.current) {
          await QR.toCanvas(ref.current, value, { width: size, margin: 1 });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} className="bg-white rounded" />;
}
