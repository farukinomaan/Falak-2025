"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGuestCart } from "./useGuestCart";

export default function GuestCartMerger({ merge }: { merge?: (ids: string[]) => Promise<void> | void }) {
  const { ids, clear } = useGuestCart();
  const [, start] = useTransition();
  const router = useRouter();
  useEffect(() => {
    if (!merge) return;
    if (!ids || ids.length === 0) return;
    start(async () => {
      try {
        await merge(ids);
        clear();
        // Ensure server data re-fetches to show merged items
        router.refresh();
      } catch {}
    });
  }, [ids, merge, clear, router]);
  return null;
}
