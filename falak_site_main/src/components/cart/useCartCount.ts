"use client";

import { useGuestCart } from "./useGuestCart";

// Simpler: the ids array reference updates when cart mutates, so length re-computes.
export function useCartCount(): number {
  const { ids } = useGuestCart();
  return Array.isArray(ids) ? ids.length : 0;
}
