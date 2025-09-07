
/**
 * @copyright Falak 2025 
 */

"use client";
import Link from "next/link";
import Image from "next/image";
import { useGuestCart } from "./useGuestCart";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";

// PassRow now includes original_id which represents the id originally stored in localStorage.
// When a user adds an EVENT (event_id) instead of a specific pass id, the guest cart stores the event id.
// The /api/cart/guest_passes endpoint resolves that to a Pass row whose own id differs from the original event id.
// For removal we must remove the ORIGINAL id from localStorage, not the resolved pass id, otherwise the item reappears.
type PassRow = { id: string; pass_name: string; description?: string | null; cost?: number | string | null; original_id?: string; event_id?: string | null };

// 'passes' prop no longer used after migration to entirely client-resolved guest cart; removing to avoid confusion.
export default function CartList() {
  const { ids, remove } = useGuestCart();
  const [guestPasses, setGuestPasses] = useState<PassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const { status } = useSession();

  // Function to fetch cart data
  const fetchCartData = async (currentIds: string[]) => {
    if (!currentIds || currentIds.length === 0) {
      setGuestPasses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ ids: currentIds.join(",") });
      const url = `/api/cart/guest_passes?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        let rows: PassRow[] = [];
        if (json?.ok && Array.isArray(json.data)) {
          rows = json.data as PassRow[];
        }
        // If signed in, fetch owned passes and filter them out from both
        // the in-memory list and localStorage ids.
        try {
          const ownRes = await fetch("/api/me/owned", { cache: "no-store" });
          const ownJson = await ownRes.json().catch(() => null);
          if (ownRes.ok && ownJson?.ok) {
            const ownedPassIds: string[] = Array.isArray(ownJson.passIds) ? ownJson.passIds : [];
            const ownedEventIds: string[] = Array.isArray(ownJson.eventIds) ? ownJson.eventIds : [];
            if (ownedPassIds.length || ownedEventIds.length) {
              const ownedSet = new Set<string>([...ownedPassIds, ...ownedEventIds]);
              const filtered = rows.filter((r: PassRow) => !ownedSet.has(r.id) && (!r.event_id || !ownedSet.has(r.event_id)));
              // Also remove any owned ids from localStorage source of truth
              try {
                const raw = localStorage.getItem("guest_cart_pass_ids");
                const cur = raw ? (JSON.parse(raw) as string[]) : [];
                const next = cur.filter((x) => !ownedSet.has(x));
                if (next.length !== cur.length) {
                  localStorage.setItem("guest_cart_pass_ids", JSON.stringify(next));
                  window.dispatchEvent(new CustomEvent("cart:updated"));
                }
              } catch {}
              rows = filtered as PassRow[];
            }
          }
        } catch {}
        setGuestPasses(rows);
      }
  } catch {
      setGuestPasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Listen for cart updates from other components
  useEffect(() => {
    fetchCartData(ids);

    const onCartUpdated = () => {
      // introduced small delay
      setTimeout(() => {
        // Get fresh IDs from localStorage directly as a fallback
        try {
          const raw = localStorage.getItem("guest_cart_pass_ids");
          const freshIds = raw ? JSON.parse(raw) : [];
          fetchCartData(freshIds);
        } catch {
          fetchCartData(ids);
        }
      }, 100);
    };

    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [ids]);

  const view = useMemo(() => guestPasses, [guestPasses]);

  const handleRemove = (displayId: string, originalId?: string) => {
    start(async () => {
      // Prefer originalId (what's actually stored) if it differs from the pass id returned by the API.
      const target = originalId && originalId.length > 0 ? originalId : displayId;
      remove(target);
      // Defensive: if both ids exist & differ, remove both (harmless if one is absent)
      if (originalId && originalId !== displayId) {
        remove(displayId);
      }
      window.dispatchEvent(new CustomEvent("cart:updated"));
  toast.success("Removed from cart");
    });
  };

  /**
   * DESIGN PART
   */
  return (
    // <div style={{ backgroundColor: '#32212C' }} className="min-h-screen pt-24 py-12 relative overflow-hidden bg-white/10">
    <div
      className="min-h-screen pt-24 py-12 relative overflow-hidden before:absolute before:inset-0 before:bg-black/30 before:pointer-events-none"
      style={{ backgroundColor: '#32212C' }}
    >
      {/* Multiple Background Layers */}
      {/* Existing waves SVG */}
      {/* <div 
        className="absolute pointer-events-none"
        style={{
          backgroundImage: 'url(/waves.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1703.5px 458.7px',
          width: '1703.5px',
          height: '458.7px',
          left: '-115px',
          top: '400px',
          zIndex: 1,
        }}
      /> */}

      {/* New Large SVG Background */}
      <div
        className="absolute pointer-events-none inset-0"
        style={{
          backgroundImage: 'url(/background.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover', // or 'contain' depending on your preference
          backgroundPosition: 'center',

          opacity: 0.2, // Adjust opacity so it doesn't overpower content
          zIndex: 0, // Behind the waves
        }}
      />


      <div className="container mx-auto max-w-6xl px-4 md:px-8 relative z-10">
        <div className="shadow-xl rounded-lg p-8" style={{ backgroundColor: '#32212C' }}>
          <h2 className="text-3xl font-bold font-serif mb-8 text-white text-center">Your Cart</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">Loading your cart...</p>
                </div>
              ) : view.length === 0 ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">Your cart is empty.</p>
                  <Link
                    href="/passes"
                    className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#DBAAA6' }}
                  >
                    Browse Passes
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg shadow-xl overflow-hidden border-2" style={{ backgroundColor: '#32212C', borderColor: '#D7897D' }}>
                    <div className="divide-y" style={{ borderColor: '#DBAAA6' }}>
                      {view.map((p) => (
                        <div key={p.id} className="p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold font-serif text-white">{p.pass_name}</h3>
                              {p.description && (
                                <p className="text-gray-400 text-sm mt-2 font-sans">{p.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Check if p.cost exists */}
                              {p.cost !== null && typeof p.cost !== 'undefined' && (
                                <div className="text-xl font-bold font-mono" style={{ color: '#DBAAA6' }}>
                                  ₹{typeof p.cost === 'number' ? p.cost.toLocaleString() : p.cost}
                                </div>
                              )}
                              <button
                                disabled={pending}
                                onClick={() => handleRemove(p.id, p.original_id)} className="px-4 py-2 font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#D7897D', color: '#32212C' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-12 rounded-lg p-6 shadow-xl border-2" style={{ borderColor: '#DBAAA6', backgroundColor: '#32212C' }}>
                <h3 className="text-xl font-bold font-serif text-white mb-4">Cart Summary</h3>
                <div className="border-t pt-4 mt-4" style={{ borderColor: '#DBAAA6' }}>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Items ({view.length})</span>
                    <span className="text-lg font-mono text-white">
                      ₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-xl pt-2">
                    <span className="text-white">Total</span>
                    <span className="font-mono" style={{ color: '#DBAAA6' }}>₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}</span>
                  </div>
                </div>
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
                  className="w-full py-4 mt-6 font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#DBAAA6', color: '#32212C' }}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 grid place-items-center">
            <Image src="/end.svg" alt="" width={256} height={128} className="w-64 h-32 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}