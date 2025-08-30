// "use client";

// import Link from "next/link";
// import { useGuestCart } from "./useGuestCart";
// import { useEffect, useMemo, useState, useTransition } from "react";
// import { useSession, signIn } from "next-auth/react";
// import { toast } from "sonner";

// type PassRow = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

// export default function CartList({ passes }: { passes: PassRow[] }) {
//   const { ids, remove } = useGuestCart();
//   const [guestPasses, setGuestPasses] = useState<PassRow[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [pending, start] = useTransition();
//   const { status } = useSession();

//   useEffect(() => {
//     if (!ids || ids.length === 0) {
//       setGuestPasses([]);
//       return;
//     }
//     const controller = new AbortController();
//     const run = async () => {
//       setLoading(true);
//       try {
//         const params = new URLSearchParams({ ids: ids.join(",") });
//         const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, {
//           method: "GET",
//           signal: controller.signal,
//           cache: "no-store",
//         });
//         if (!res.ok) return setGuestPasses([]);
//         const json = await res.json();
//         if (json?.ok && Array.isArray(json.data)) setGuestPasses(json.data);
//         else setGuestPasses([]);
//       } catch {
//         setGuestPasses([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     run();
//     return () => controller.abort();
//   }, [ids]);

//   const view = useMemo(() => guestPasses, [guestPasses]);

//   const handleRemove = (id: string) => {
//     start(async () => {
//   remove(id);
//     });
//   };
//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       <h1 className="text-2xl font-semibold">Your Cart</h1>
//   {loading ? (
//         <div className="border rounded p-6 text-sm text-gray-600">Loading your cart…</div>
//       ) : view.length === 0 ? (
//         <div className="border rounded p-6 text-sm text-gray-600">No items. <Link href="/passes" className="underline">Browse passes</Link>.</div>
//       ) : (
//         <>
//           <ul className="divide-y border rounded">
//             {view.map((p) => (
//               <li key={p.id} className="p-4 flex items-center justify-between gap-4">
//                 <div>
//                   <div className="font-medium">{p.pass_name}</div>
//                   {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   {typeof p.cost !== "undefined" && p.cost !== null && (
//                     <div className="text-sm font-semibold">₹{p.cost}</div>
//                   )}
//                   <button disabled={pending} onClick={() => handleRemove(p.id)} className="px-3 py-1 rounded bg-gray-200">Remove</button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//           <div className="flex justify-end">
//             <button
//               onClick={() => {
//                 if (status !== "authenticated") {
//                   toast.info("Sign in to proceed to checkout");
//                   signIn();
//                   return;
//                 }
//                 window.location.href = "/checkout";
//               }}
//               disabled={pending}
//               className="px-4 py-2 rounded bg-black text-white"
//             >
//               Proceed to Checkout
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// "use client";
// import Link from "next/link";
// import { useGuestCart } from "./useGuestCart";
// import { useEffect, useMemo, useState, useTransition } from "react";
// import { useSession, signIn } from "next-auth/react";
// import { toast } from "sonner";

// type PassRow = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

// export default function CartList({ passes }: { passes: PassRow[] }) {
//   const { ids, remove } = useGuestCart();
//   const [guestPasses, setGuestPasses] = useState<PassRow[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [pending, start] = useTransition();
//   const { status } = useSession();

//   useEffect(() => {
//     if (!ids || ids.length === 0) {
//       setGuestPasses([]);
//       return;
//     }
//     const controller = new AbortController();
//     const run = async () => {
//       setLoading(true);
//       try {
//         const params = new URLSearchParams({ ids: ids.join(",") });
//         const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, {
//           method: "GET",
//           signal: controller.signal,
//           cache: "no-store",
//         });
//         if (!res.ok) return setGuestPasses([]);
//         const json = await res.json();
//         if (json?.ok && Array.isArray(json.data)) setGuestPasses(json.data);
//         else setGuestPasses([]);
//       } catch {
//         setGuestPasses([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     run();
//     return () => controller.abort();
//   }, [ids]);

//   const view = useMemo(() => guestPasses, [guestPasses]);

//   const handleRemove = (id: string) => {
//     start(async () => {
//       remove(id);
//     });
//   };

//   return (
//     <div style={{ backgroundColor: '#191919' }} className="min-h-screen pt-48 py-12">
//       <div className="container mx-auto max-w-6xl px-4 md:px-8">
//         <div className="shadow-xl rounded-lg p-8" style={{ backgroundColor: '#2a2a2a' }}>
//           <h2 className="text-3xl font-bold font-serif mb-8 text-white text-center">Your Cart</h2>
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
//             {/* Left Column - Cart Items */}
//             <div className="lg:col-span-2">
//               {loading ? (
//                 <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
//                   <p className="text-gray-400 text-lg mb-6 font-medium">Loading your cart...</p>
//                 </div>
//               ) : view.length === 0 ? (
//                 <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
//                   <p className="text-gray-400 text-lg mb-6 font-medium">Your cart is empty.</p>
//                   <Link 
//                     href="/passes" 
//                     className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
//                     style={{ backgroundColor: '#59917E' }}
//                   >
//                     Browse Passes
//                   </Link>
//                 </div>
//               ) : (
//                 <div className="space-y-6">
//                   <div className="rounded-lg shadow-xl overflow-hidden border-2" style={{ backgroundColor: '#2a2a2a', borderColor: '#D24A58' }}>
//                     <div className="divide-y" style={{ borderColor: '#59917E' }}>
//                       {view.map((p) => (
//                         <div key={p.id} className="p-6">
//                           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                             <div className="flex-1">
//                               <h3 className="text-lg font-bold font-serif text-white">{p.pass_name}</h3>
//                               {p.description && (
//                                 <p className="text-gray-400 text-sm mt-2 font-sans">{p.description}</p>
//                               )}
//                             </div>
//                             <div className="flex items-center gap-4">
//                               {/* Check if p.cost exists before rendering */}
//                               {p.cost !== null && typeof p.cost !== 'undefined' && (
//                                 <div className="text-xl font-bold font-mono" style={{ color: '#59917E' }}>
//                                   ₹{p.cost.toLocaleString()}
//                                 </div>
//                               )}
//                               <button
//                                 disabled={pending}
//                                 onClick={() => handleRemove(p.id)}
//                                 className="px-4 py-2 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
//                                 style={{ backgroundColor: '#D24A58' }}
//                               >
//                                 Remove
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Right Column - Cart Summary */}
//             <div className="lg:col-span-1">
//               <div className="sticky top-12 rounded-lg p-6 shadow-xl border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
//                 <h3 className="text-xl font-bold font-serif text-white mb-4">Cart Summary</h3>
//                 <div className="border-t pt-4 mt-4" style={{ borderColor: '#59917E' }}>
//                   <div className="flex items-center justify-between py-2">
//                     <span className="text-gray-400">Items ({view.length})</span>
//                     <span className="text-lg font-mono text-white">
//                       ₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between font-bold text-xl pt-2">
//                     <span className="text-white">Total</span>
//                     <span className="font-mono" style={{ color: '#59917E' }}>₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}</span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => {
//                     if (status !== "authenticated") {
//                       toast.info("Sign in to proceed to checkout");
//                       signIn();
//                       return;
//                     }
//                     window.location.href = "/checkout";
//                   }}
//                   disabled={pending}
//                   className="w-full py-4 mt-6 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
//                   style={{ backgroundColor: '#59917E' }}
//                 >
//                   Continue to Checkout
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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

  // Listen for cart updates from other components AND ids changes
  useEffect(() => {
    fetchCartData(ids);

    const onCartUpdated = () => {
      // Use a small delay to ensure localStorage has been updated
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
      // Dispatch event to update other cart components
      window.dispatchEvent(new CustomEvent("cart:updated"));
    });
  };

  return (
    <div style={{ backgroundColor: '#191919' }} className="min-h-screen pt-48 py-12">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="shadow-xl rounded-lg p-8" style={{ backgroundColor: '#2a2a2a' }}>
          <h2 className="text-3xl font-bold font-serif mb-8 text-white text-center">Your Cart</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">Loading your cart...</p>
                </div>
              ) : view.length === 0 ? (
                <div className="rounded-xl p-8 text-center shadow-lg border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
                  <p className="text-gray-400 text-lg mb-6 font-medium">Your cart is empty.</p>
                  <Link 
                    href="/passes" 
                    className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: '#59917E' }}
                  >
                    Browse Passes
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg shadow-xl overflow-hidden border-2" style={{ backgroundColor: '#2a2a2a', borderColor: '#D24A58' }}>
                    <div className="divide-y" style={{ borderColor: '#59917E' }}>
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
                              {/* Check if p.cost exists before rendering */}
                              {p.cost !== null && typeof p.cost !== 'undefined' && (
                                <div className="text-xl font-bold font-mono" style={{ color: '#59917E' }}>
                                  ₹{typeof p.cost === 'number' ? p.cost.toLocaleString() : p.cost}
                                </div>
                              )}
                              <button
                                disabled={pending}
                                onClick={() => handleRemove(p.id)}
                                className="px-4 py-2 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#D24A58' }}
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
              <div className="sticky top-12 rounded-lg p-6 shadow-xl border-2" style={{ borderColor: '#59917E', backgroundColor: '#2a2a2a' }}>
                <h3 className="text-xl font-bold font-serif text-white mb-4">Cart Summary</h3>
                <div className="border-t pt-4 mt-4" style={{ borderColor: '#59917E' }}>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Items ({view.length})</span>
                    <span className="text-lg font-mono text-white">
                      ₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-xl pt-2">
                    <span className="text-white">Total</span>
                    <span className="font-mono" style={{ color: '#59917E' }}>₹{view.reduce((sum, p) => sum + (typeof p.cost === 'number' ? p.cost : 0), 0).toLocaleString()}</span>
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
                  style={{ backgroundColor: '#59917E' }}
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