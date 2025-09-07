"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGuestCart } from "./useGuestCart";

/**
 * A simplified Add to Cart button variant for the `/passes` page.
 * Differences from `AddToCartButton`:
 * - No leader warning / confirmation popup
 * - No pre-fetch probe; directly adds the pass id
 * - Keeps success toast & disabled state after adding
 */
export default function PassAddToCartButton({
  passId,
  className,
}: {
  passId: string;
  className?: string;
}) {
  const router = useRouter();
  const { add, ids } = useGuestCart();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const inCart = useMemo(() => added || (ids || []).includes(passId), [added, ids, passId]);

  const swappedClassName = useMemo(() => {
    const base = className || "px-4 py-2 rounded bg-black text-white text-sm";
    // Simple targeted swaps for our known styles
    let swapped = base
      .replace(/bg-\[#D7897D\]/g, "bg-white")
      .replace(/text-white/g, "text-\[#D7897D\]");
    // Fallback generic swap
    if (swapped === base) {
      swapped = base
        .replace(/bg-black/g, "bg-white")
        .replace(/text-white/g, "text-black");
    }
    return swapped;
  }, [className]);

  const handleClick = () => {
    if (pending) return;
    if (inCart) {
      router.push("/cart");
      return;
    }
      // Debug log to verify click fires
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PassAddToCartButton] click', { passId, pending, added });
      }
    start(() => {
      add(passId);
      setAdded(true);
      // Notify any listeners (cart icon count, etc.)
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
        if (process.env.NODE_ENV !== 'production') {
          console.log('[PassAddToCartButton] added', { passId });
        }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={inCart ? swappedClassName : (className || "px-4 py-2 rounded bg-black text-white text-sm")}
    >
      {inCart ? "Go to Cart" : pending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
