"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "guest_cart_pass_ids";

export function useGuestCart() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
    // Sync across tabs & ensure late hydration doesn't lose state
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try { setIds(e.newValue ? JSON.parse(e.newValue) : []); } catch { setIds([]); }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const persist = useCallback((next: string[]) => {
    setIds(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);
  const add = useCallback((id: string) => {
    setIds((prev) => {
      const next = Array.from(new Set([...(prev || []), id]));
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = (prev || []).filter((x) => x !== id);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const clear = useCallback(() => persist([]), [persist]);
  return { ids, add, remove, clear };
}
