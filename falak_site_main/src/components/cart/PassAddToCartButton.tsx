"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useGuestCart } from "./useGuestCart";

/**
 * A simplified Add to Cart button variant for the `/passes` page.
 * Differences from `AddToCartButton`:
 * - No leader warning / confirmation popup
 * - No pre-fetch probe; directly adds the pass id
 * - Keeps success toast & disabled state after adding
 */
export default function PassAddToCartButton({ passId, className }: { passId: string; className?: string }) {
  const { add } = useGuestCart();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    if (pending || added) return;
    start(() => {
      add(passId);
      setAdded(true);
      // Notify any listeners (cart icon count, etc.)
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending || added}
      className={className || "px-4 py-2 rounded bg-black text-white text-sm"}
    >
      {added ? "Added" : pending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
