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
    persist(Array.from(new Set([...(ids || []), id])));
  }, [ids, persist]);
  const remove = useCallback((id: string) => {
    persist((ids || []).filter((x) => x !== id));
  }, [ids, persist]);
  const clear = useCallback(() => persist([]), [persist]);
  return { ids, add, remove, clear };
}
