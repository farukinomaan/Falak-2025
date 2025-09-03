
/**
 * @copyright Falak 2025 
 */


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
        if (json?.ok && Array.isArray(json.data)) {
          setGuestPasses(json.data);
        } else {
          setGuestPasses([]);
        }
      }
    } catch (error) {
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

  const handleRemove = (id: string) => {
    start(async () => {
      remove(id);
      // Dispatching event to update other cart components
      window.dispatchEvent(new CustomEvent("cart:updated"));
    });
  };


  /**
   * DESGIN PART
   */
  return (
    <div style={{ backgroundColor: '#32212C' }} className="min-h-screen pt-24 py-12 relative overflow-hidden">
      {/* Ribbon Background - Exact match to reference */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main flowing ribbon wave - matches the reference exactly */}
        <div className="absolute bottom-0 left-0 w-full h-full">
          <svg
            viewBox="0 0 1200 600"
            className="absolute bottom-0 left-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Main pink ribbon layer - larger and more prominent */}
            <path
              d="M0,300 C150,200 350,250 500,220 C650,190 800,160 950,180 C1100,200 1150,220 1200,200 L1200,600 L0,600 Z"
              fill="#DBAAA6"
              opacity="0.9"
            />
            {/* Secondary deeper layer */}
            <path
              d="M0,350 C200,280 400,320 600,300 C750,280 900,260 1050,280 C1150,295 1180,310 1200,300 L1200,600 L0,600 Z"
              fill="#D7897D"
              opacity="1.0"
            />
            {/* Third layer for depth */}
            <path
              d="M0,400 C180,350 380,380 580,360 C720,345 860,330 1000,340 C1120,350 1180,360 1200,355 L1200,600 L0,600 Z"
              fill="#32212C"
              opacity="1.0"
            />
          </svg>
        </div>
      </div>

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
                                onClick={() => handleRemove(p.id)}
                                className="px-4 py-2 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#D7897D' }}
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
                  className="w-full py-4 mt-6 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#DBAAA6' }}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}