"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGuestCart } from "./useGuestCart";
import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";

// Lightweight probe for pass -> event meta to decide if we need leader confirmation (esports + non-MAHE should skip)
async function fetchPassMeta(passId: string): Promise<{ sub_cluster?: string | null; mahe?: boolean | null } | null> {
  try {
    const params = new URLSearchParams({ ids: passId });
    const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !Array.isArray(json.data) || !json.data.length) return null;
    const row = json.data[0];
    return { sub_cluster: row.sub_cluster || row.subCluster || row.event_sub_cluster || null, mahe: row.mahe ?? null };
  } catch { return null; }
}

export default function AddToCartButton({ passId, className }: { passId: string; className?: string }) {
  const router = useRouter();
  const { add, ids } = useGuestCart();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const { status, data: session } = useSession();
  interface SessLike { user?: { mahe?: boolean | null } }
  const userIsMahe = Boolean((session as SessLike | null)?.user?.mahe);
  const [isEsports, setIsEsports] = useState<boolean | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const meta = await fetchPassMeta(passId);
      if (!ignore) setIsEsports((meta?.sub_cluster || '').toLowerCase() === 'esports');
    })();
    return () => { ignore = true; };
  }, [passId]);
  const inCart = useMemo(() => added || (ids || []).includes(passId), [added, ids, passId]);
  const swappedClassName = useMemo(() => {
    const base = className || "px-4 py-2 rounded bg-black text-white";
    let swapped = base
      .replace(/bg-\[#D7897D\]/g, "bg-white")
      .replace(/text-white/g, "text-\[#D7897D\]");
    if (swapped === base) {
      swapped = base
        .replace(/bg-black/g, "bg-white")
        .replace(/text-white/g, "text-black");
    }
    return swapped;
  }, [className]);

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
    if (pending) return;
    // Require sign-in only when trying to add (not for "Go to Cart")
    if (!inCart && status !== "authenticated") {
      toast.info("Sign in to continue");
      signIn();
      return;
    }
    if (inCart) {
      router.push("/cart");
      return;
    }
    const skipLeaderConfirm = isEsports === true && !userIsMahe; // non-MAHE & esports
    if (skipLeaderConfirm) {
      start(confirmAndAdd);
      return;
    }
    toast.info(() => (
      <div className="space-y-2">
        <p className="text-sm font-medium">Only the team leader must purchase access to this event.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { toast.dismiss(); }}
            className="text-xs px-3 py-1 rounded border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => { toast.dismiss(); start(confirmAndAdd); }}
            className="text-xs px-3 py-1 rounded bg-emerald-600 text-white"
          >
            Proceed
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  return (
    <button onClick={onClick} disabled={pending} className={inCart ? swappedClassName : (className || "px-4 py-2 rounded bg-black text-white")}>
      {inCart ? "Go to Cart" : pending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
