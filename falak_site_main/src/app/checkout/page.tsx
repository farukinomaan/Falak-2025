// "use client";

// import { useGuestCart } from "@/components/cart/useGuestCart";
// import { useEffect, useMemo, useState } from "react";
// import CheckoutGrid from "@/components/cart/CheckoutGrid";
// import { useSession, signIn } from "next-auth/react";
// import Link from "next/link";

// type Row = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

// export default function CheckoutPage() {
//   const { status } = useSession();
//   const { ids, clear } = useGuestCart();
//   const [passes, setPasses] = useState<Row[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (status === "authenticated" && ids.length > 0) {
//       const controller = new AbortController();
//       const run = async () => {
//         setLoading(true);
//         try {
//           const params = new URLSearchParams({ ids: ids.join(",") });
//           const res = await fetch(`/api/cart/guest_passes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
//           const json = await res.json().catch(() => null);
//           if (res.ok && json?.ok && Array.isArray(json.data)) setPasses(json.data);
//           else setPasses([]);
//         } catch {
//           setPasses([]);
//         } finally {
//           setLoading(false);
//         }
//       };
//       run();
//       return () => controller.abort();
//     } else {
//       setPasses([]);
//     }
//   }, [ids, status]);

//   const total = useMemo(() => passes.reduce((sum, p) => sum + (typeof p.cost === "number" ? p.cost : 0), 0), [passes]);

//   if (status === "loading") {
//     return <div className="max-w-3xl mx-auto p-6">Loading session…</div>;
//   }
//   if (status !== "authenticated") {
//     return (
//       <div className="max-w-3xl mx-auto p-6 space-y-4">
//         <div>Please sign in to checkout.</div>
//         <button onClick={() => signIn()} className="px-4 py-2 rounded bg-black text-white">Sign In</button>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">Checkout</h1>
//         {passes.length > 0 && (
//           <button onClick={() => clear()} className="text-sm underline text-gray-600">Clear cart</button>
//         )}
//       </div>
//       {loading ? (
//         <div className="border rounded p-6 text-sm text-gray-600">Loading your items…</div>
//       ) : passes.length === 0 ? (
//         <div className="border rounded p-6 text-sm text-gray-600">
//           No items. <Link href="/passes" className="underline">Browse passes</Link>.
//         </div>
//       ) : (
//         <>
//           <CheckoutGrid items={passes} />
//           <div className="flex flex-col items-end gap-4">
//             <div className="text-right">
//               <div className="text-sm text-gray-600">Total</div>
//               <div className="text-xl font-semibold">₹{total}</div>
//             </div>
//             <div className="w-full flex justify-between">
//               <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60" disabled={passes.length === 0} >
//                 |-- Go back
//               </button>
//               <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60" disabled={passes.length === 0} >
//                 Done
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

"use client";

import { useGuestCart } from "@/components/cart/useGuestCart";
import { useEffect, useMemo, useState } from "react";
import CheckoutGrid from "@/components/cart/CheckoutGrid";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

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
    return <div className="max-w-3xl mx-auto p-6 font-sans text-gray-600">Loading session…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4 font-sans text-gray-700">
        <div>Please sign in to checkout.</div>
        <button onClick={() => signIn()} className="px-6 py-2 rounded-md bg-green-700 text-white font-bold transition-colors hover:bg-green-800">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-serif text-gray-800">Checkout</h1>
        {passes.length > 0 && (
          <button onClick={() => clear()} className="text-sm underline text-red-500 font-sans hover:text-red-700 transition-colors">Clear cart</button>
        )}
      </div>
      {loading ? (
        <div className="border border-green-700 rounded-md p-6 text-sm text-gray-400 font-sans">Loading your items…</div>
      ) : passes.length === 0 ? (
        <div className="bg-white border-2 border-green-700 rounded-md p-6 text-sm text-gray-400 font-sans shadow-md">
          No items. <Link href="/passes" className="text-blue-500 underline hover:text-blue-300 transition-colors">Browse passes</Link>.
        </div>
      ) : (
        <>
          <CheckoutGrid items={passes} />
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 font-sans">Total</div>
              <div className="text-2xl font-bold text-green-700 font-mono">₹{total}</div>
            </div>
            <div className="w-full flex justify-between">
              <button className="px-6 py-3 rounded-md bg-gray-500 text-white font-semibold transition-colors hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-sans" disabled={passes.length === 0} >
                Go back
              </button>
              <button className="px-6 py-3 rounded-md bg-green-700 text-white font-bold transition-colors hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-sans" disabled={passes.length === 0} >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}