"use client";

import { useState, useTransition } from "react";
import { useGuestCart } from "./useGuestCart";
import { toast } from "sonner";

export default function AddToCartButton({ passId, className }: { passId: string; className?: string }) {
  const { add } = useGuestCart();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  const onClick = () => {
    start(async () => {
      // Probe if this id (pass or event) maps to at least one Pass; if not, show guidance.
      try {
        const params = new URLSearchParams({ ids: passId });
        const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error();
        const arr = Array.isArray(json.data) ? json.data : [];
        if (arr.length === 0) {
          toast.warning(
            <span>
              Event not assigned to any pass yet. <a href="/tickets" className="underline">Raise ticket</a>
            </span>
          );
          return;
        }
      } catch {
        // Non-fatal; continue to add optimistically
      }
      add(passId);
      setAdded(true);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      toast.success("Added to cart");
    });
  };

  return (
    <button onClick={onClick} disabled={pending || added} className={className || "px-4 py-2 rounded bg-black text-white"}>
      {added ? "Added" : pending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
