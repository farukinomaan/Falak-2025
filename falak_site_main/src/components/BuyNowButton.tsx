"use client";

import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";

export default function BuyNowButton({ label = "Buy Now" }: { label?: string }) {
  const { status } = useSession();
  return (
    <button
      onClick={() => {
        if (status !== "authenticated") {
          toast.info("Sign in to continue");
          signIn();
          return;
        }
        toast.info("Checkout coming soon");
      }}
      className="inline-block border border-white mt-2 px-3 py-2 rounded bg-black text-white"
      type="button"
    >
      {label}
    </button>
  );
}

