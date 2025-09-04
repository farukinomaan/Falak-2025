/**
 * @copyright Falak 2025 
 */

"use client";

import { useGuestCart } from "@/components/cart/useGuestCart";
import { useEffect, useMemo, useState } from "react";
import CheckoutGrid from "@/components/cart/CheckoutGrid";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

type Row = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

export default function CheckoutPage() {
  const { status } = useSession();
  const { ids, clear } = useGuestCart();
  const [passes, setPasses] = useState<Row[]>([]);
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

  if (status === "loading") {
    return (
      <div style={{ backgroundColor: '#191919' }} className="min-h-screen py-12 px-4 md:px-8 flex items-center justify-center">
        <div className="max-w-md p-8 text-center text-white">Loading session…</div>
      </div>
    );
  }
  
  if (status !== "authenticated") {
    return (
      <div style={{ backgroundColor: '#191919' }} className="min-h-screen py-12 px-4 md:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md p-8 rounded-lg shadow-xl text-center" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="text-white text-lg font-bold mb-4">Please sign in to checkout.</div>
          <button onClick={() => signIn()} className="w-full px-6 py-3 rounded-md text-white font-bold transition-colors hover:bg-green-800" style={{ backgroundColor: '#59917E' }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#191919' }} className="min-h-screen pt-24 py-12 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="shadow-xl rounded-lg p-8" style={{ backgroundColor: '#2a2a2a' }}>
          <h2 className="text-3xl font-bold font-serif mb-8 text-white text-center">Checkout</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Checkout Grid */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="border border-green-700 rounded-md p-6 text-sm text-white font-sans">Loading your items…</div>
              ) : passes.length === 0 ? (
                <div className="border border-green-700 rounded-md p-6 text-sm text-white font-sans">
                  No items. <Link href="/passes" className="underline text-blue-400 hover:text-blue-300 transition-colors">Browse passes</Link>.
                </div>
              ) : (
                <CheckoutGrid items={passes} />
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-12 rounded-lg p-6 shadow-xl border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
                <div className="flex flex-col items-end gap-4">
                  <h3 className="text-xl font-bold font-serif text-white mb-4 w-full">Order Summary</h3>
                  <div className="w-full">
                    <div className="flex items-center justify-between py-2 border-t border-gray-700">
                      <div className="text-sm text-gray-400 font-sans">Total</div>
                      <div className="text-2xl font-bold font-mono text-green-700">₹{total}</div>
                    </div>
                  </div>
                  <div className="w-full flex justify-between gap-4 mt-6">
                    <button className="flex-1 py-3 rounded-md bg-gray-500 text-white font-semibold transition-colors hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-sans" disabled={passes.length === 0} onClick={() => window.history.back()}>
                      Go back
                    </button>
                    <button className="flex-1 py-3 rounded-md bg-green-700 text-white font-bold transition-colors hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-sans" disabled={passes.length === 0} >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}