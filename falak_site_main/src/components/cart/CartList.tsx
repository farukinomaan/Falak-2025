"use client";

import Link from "next/link";
import { useGuestCart } from "./useGuestCart";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";

type PassRow = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

export default function CartList({ passes }: { passes: PassRow[] }) {
  const { ids, remove } = useGuestCart();
  const [guestPasses, setGuestPasses] = useState<PassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const { status } = useSession();

  useEffect(() => {
    if (!ids || ids.length === 0) {
      setGuestPasses([]);
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ids: ids.join(",") });
        const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return setGuestPasses([]);
        const json = await res.json();
        if (json?.ok && Array.isArray(json.data)) setGuestPasses(json.data);
        else setGuestPasses([]);
      } catch {
        setGuestPasses([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [ids]);

  const view = useMemo(() => guestPasses, [guestPasses]);

  const handleRemove = (id: string) => {
    start(async () => {
  remove(id);
    });
  };
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Cart</h1>
  {loading ? (
        <div className="border rounded p-6 text-sm text-gray-600">Loading your cart…</div>
      ) : view.length === 0 ? (
        <div className="border rounded p-6 text-sm text-gray-600">No items. <Link href="/passes" className="underline">Browse passes</Link>.</div>
      ) : (
        <>
          <ul className="divide-y border rounded">
            {view.map((p) => (
              <li key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{p.pass_name}</div>
                  {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
                </div>
                <div className="flex items-center gap-3">
                  {typeof p.cost !== "undefined" && p.cost !== null && (
                    <div className="text-sm font-semibold">₹{p.cost}</div>
                  )}
                  <button disabled={pending} onClick={() => handleRemove(p.id)} className="px-3 py-1 rounded bg-gray-200">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (status !== "authenticated") {
                  toast.info("Sign in to proceed to checkout");
                  signIn();
                  return;
                }
                window.location.href = "/checkout";
              }}
              disabled={pending}
              className="px-4 py-2 rounded bg-black text-white"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
