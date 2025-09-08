'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  stopLoaderOnReveal?: boolean;
  minDelayMs?: number;
};

// Shows fallback on SSR and until client mounts; then reveals children and stops global nav loader.
export default function MountReveal({
  children,
  fallback,
  stopLoaderOnReveal = true,
  minDelayMs = 120,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const tm = setTimeout(() => {
      setRevealed(true);
      if (stopLoaderOnReveal) {
        try {
          window.dispatchEvent(new CustomEvent('navprogress-stop'));
        } catch {}
      }
    }, Math.max(0, minDelayMs));
    return () => clearTimeout(tm);
  }, [stopLoaderOnReveal, minDelayMs]);

  return <>{revealed ? children : fallback}</>;
}
