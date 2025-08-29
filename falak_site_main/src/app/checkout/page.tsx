"use client";

import { useGuestCart } from "@/components/cart/useGuestCart";
import { useEffect, useMemo, useState } from "react";
import CheckoutGrid from "@/components/cart/CheckoutGrid";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type Row = { id: string; pass_name: string; description?: string | null; cost?: number | string | null; event_id?: string | null };
type EventRow = { id: string; name: string };

export default function CheckoutPage() {
  const { status } = useSession();
  const { ids, clear } = useGuestCart();
  const [passes, setPasses] = useState<Row[]>([]);
  const [eventsById, setEventsById] = useState<Map<string, EventRow>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && ids.length > 0) {
      const controller = new AbortController();
      const run = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({ ids: ids.join(",") });
          const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
          const json = await res.json().catch(() => null);
          if (res.ok && json?.ok && Array.isArray(json.data)) setPasses(json.data);
          else setPasses([]);
        } catch {
          setPasses([]);
        } finally {
          setLoading(false);
        }
      };
      run();
      return () => controller.abort();
    } else {
      setPasses([]);
    }
  }, [ids, status]);

  const total = useMemo(() => passes.reduce((sum, p) => sum + (typeof p.cost === "number" ? p.cost : 0), 0), [passes]);

  useEffect(() => {
    const eventIds = Array.from(new Set(passes.map(p => p.event_id).filter(Boolean))) as string[];
    if (eventIds.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ ids: eventIds.join(",") });
        const res = await fetch(`/api/events/byIds?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json?.ok || !Array.isArray(json.data) || cancelled) return;
        const map = new Map<string, EventRow>();
        (json.data as EventRow[]).forEach(r => map.set(r.id, r));
        setEventsById(map);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [passes]);

  if (status === "loading") {
    return <div className="max-w-3xl mx-auto p-6">Loading session…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div>Please sign in to checkout.</div>
        <button onClick={() => signIn()} className="px-4 py-2 rounded bg-black text-white">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        {passes.length > 0 && (
          <button onClick={() => clear()} className="text-sm underline text-gray-600">Clear cart</button>
        )}
      </div>
      {loading ? (
        <div className="border rounded p-6 text-sm text-gray-600">Loading your items…</div>
      ) : passes.length === 0 ? (
        <div className="border rounded p-6 text-sm text-gray-600">
          No items. <Link href="/passes" className="underline">Browse passes</Link>.
        </div>
      ) : (
        <>
          <CheckoutGrid items={passes} eventsById={eventsById} />
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-semibold">₹{total}</div>
            </div>
            <div className="w-full flex justify-between">
              <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60" onClick={()=>{}} >
                |-- Go back
              </button>
              <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60" disabled={passes.length === 0} >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
