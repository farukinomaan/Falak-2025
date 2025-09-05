

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
      <div style={{ backgroundColor: '#32212C' }} className="min-h-screen py-12 px-4 md:px-8 flex items-center justify-center relative overflow-hidden">
        {/* svg waves background*/}
        <div
          className="absolute bottom-0 left-0 w-full h-[458px] pointer-events-none bg-no-repeat bg-cover"
          style={{
            backgroundImage: "url('/waves.svg')",
            backgroundPosition: "bottom center",
          }}
        />

        <div className="max-w-md p-8 text-center text-white relative z-10 rounded-xl shadow-lg border-2" style={{ backgroundColor: '#32212C', borderColor: '#DBAAA6' }}>
          Loading session…
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div style={{ backgroundColor: '#32212C' }} className="min-h-screen py-12 px-4 md:px-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* svg waves background */}
        <div
          className="absolute bottom-0 left-0 w-full h-[458px] pointer-events-none bg-no-repeat bg-cover"
          style={{
            backgroundImage: "url('/waves.svg')",
            backgroundPosition: "bottom center",
          }}
        />

        <div className="max-w-md p-8 rounded-xl shadow-xl text-center relative z-10 border-2" style={{ backgroundColor: '#32212C', borderColor: '#DBAAA6' }}>
          <div className="text-white text-lg font-bold mb-4 font-serif">Please sign in to checkout.</div>
          <button
            onClick={() => signIn()}
            className="w-full px-6 py-3 rounded-lg text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-sans"
            style={{ backgroundColor: '#DBAAA6' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#32212C' }} className="min-h-screen pt-24 py-12 relative overflow-hidden">
      {/* Ribbon Background - Exact match to cart */}
      <div
        className="absolute bottom-0 left-0 w-full h-[458px] pointer-events-none bg-no-repeat bg-cover"
        style={{
          backgroundImage: "url('/waves.svg')",
          backgroundPosition: "bottom center",
        }}
      />


      <div className="container mx-auto max-w-6xl px-4 md:px-8 relative z-10">
        <div className="shadow-xl rounded-lg p-8" style={{ backgroundColor: '#32212C' }}>
          <h2 className="text-3xl font-bold font-serif mb-8 text-white text-center">Checkout</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Checkout Grid */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">Loading your items…</p>
                </div>
              ) : passes.length === 0 ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">No items.</p>
                  <Link
                    href="/passes"
                    className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#DBAAA6' }}
                  >
                    Browse passes
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg shadow-xl overflow-hidden border-2" style={{ backgroundColor: '#32212C', borderColor: '#D7897D' }}>
                  <CheckoutGrid items={passes} />
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-12 rounded-lg p-6 shadow-xl border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                <h3 className="text-xl font-bold font-serif text-white mb-4">Order Summary</h3>
                <div className="border-t pt-4 mt-4" style={{ borderColor: '#DBAAA6' }}>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400 font-sans">Items ({passes.length})</span>
                    <span className="text-lg font-mono text-white">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-xl pt-2">
                    <span className="text-white font-serif">Total</span>
                    <span className="font-mono" style={{ color: '#DBAAA6' }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    className="flex-1 py-3 rounded-lg text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    disabled={passes.length === 0}
                    onClick={() => window.history.back()}
                    style={{ backgroundColor: '#D7897D' }}
                  >
                    Go back
                  </button>
                  <button
                    className="flex-1 py-3 rounded-lg text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    disabled={passes.length === 0}
                    style={{ backgroundColor: '#DBAAA6' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}