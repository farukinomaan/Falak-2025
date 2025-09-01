"use client";

import { useState, useTransition } from "react";
import { useGuestCart } from "./useGuestCart";
import { toast } from "sonner";

export default function AddToCartButton({ passId, className }: { passId: string; className?: string }) {
  const { add } = useGuestCart();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  const confirmAndAdd = async () => {
    // Probe mapping to pass
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
      // continue
    }
    add(passId);
    setAdded(true);
    window.dispatchEvent(new CustomEvent("cart:updated"));
    toast.success("Added to cart");
  };

  const onClick = () => {
    if (added || pending) return;
    toast.info(
      () => (
        <div className="space-y-2">
          <p className="text-sm font-medium">Only the team leader must purchase access to this event.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                toast.dismiss();
              }}
              className="text-xs px-3 py-1 rounded border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                start(confirmAndAdd);
              }}
              className="text-xs px-3 py-1 rounded bg-emerald-600 text-white"
            >
              Proceed
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  return (
    <button onClick={onClick} disabled={pending || added} className={className || "px-4 py-2 rounded bg-black text-white"}>
  {added ? "Added" : pending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
