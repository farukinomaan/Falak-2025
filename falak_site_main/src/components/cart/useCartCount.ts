"use client";

import { useEffect, useState } from "react";
import { useGuestCart } from "./useGuestCart";

export function useCartCount() {
  const { ids } = useGuestCart();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const recompute = () => {
      if (!cancelled) setCount(Array.isArray(ids) ? ids.length : 0);
    };
    recompute();
    const onUpdated = () => recompute();
    window.addEventListener("cart:updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("cart:updated", onUpdated);
    };
  }, [ids]);

  return count;
}
