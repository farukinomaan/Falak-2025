'use client';
import { useEffect } from 'react';

export default function LoadingIndicatorClient({
  startOnMount = true,
  stopOnMount = false,
  stopOnUnmount = true,
}: {
  startOnMount?: boolean;
  stopOnMount?: boolean;
  stopOnUnmount?: boolean;
}) {
  useEffect(() => {
    if (startOnMount) {
      try { window.dispatchEvent(new CustomEvent('navprogress-start')); } catch {}
    }
    if (stopOnMount) {
      try { window.dispatchEvent(new CustomEvent('navprogress-stop')); } catch {}
    }
    return () => {
      if (stopOnUnmount) {
        try { window.dispatchEvent(new CustomEvent('navprogress-stop')); } catch {}
      }
    };
  }, [startOnMount, stopOnMount, stopOnUnmount]);
  return null;
}
