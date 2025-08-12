"use client";

import { toast } from "sonner";

export default function BuyNowButton({ label = "Buy Now" }: { label?: string }) {
  return (
    <button
      onClick={() => toast.info("Checkout coming soon")}
      className="inline-block border border-white mt-2 px-3 py-2 rounded bg-black text-white"
      type="button"
    >
      {label}
    </button>
  );
}

