"use client";

import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";

const PAYMENT_URL = "https://payment.manipal.edu/falak-Login";

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
        try { localStorage.setItem('falak_payment_in_progress', '1'); } catch {}
        window.location.href = PAYMENT_URL;
      }}
      className="inline-block border border-white mt-2 px-3 py-2 rounded bg-black text-white"
      type="button"
    >
      {label}
    </button>
  );
}

