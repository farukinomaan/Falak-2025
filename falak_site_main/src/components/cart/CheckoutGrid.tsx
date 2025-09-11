"use client";

import { useState, useEffect, useCallback } from "react";

type Row = { id: string; pass_name: string; description?: string | null; event_id?: string | null; original_id?: string };
interface Props { items: Row[]; eventsById?: Map<string, { id: string; name: string }> }

/**
 * CheckoutGrid
 * For non-MAHE users only (per business rule, only they use Add to Cart now).
 * Replaces old per-item Validate flow with a Pay redirect.
 * After returning from external payment portal, we show a disabled "Validating..." state.
 * Future integration: replace localStorage flag check with actual server reconciliation logic.
 */
export default function CheckoutGrid({ items, eventsById }: Props) {
  const [returningFromPayment, setReturningFromPayment] = useState(false);
  const paymentUrl = "https://payment.manipal.edu/falak-Login";

  // Detect if user is coming back from payment portal (placeholder logic)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const flag = localStorage.getItem('falak_payment_in_progress');
      if (flag === '1') {
        setReturningFromPayment(true);
        // Keep the flag for now; future logic can clear after server confirms.
      }
    } catch {}
  }, []);

  const handlePay = useCallback(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('falak_payment_in_progress', '1'); } catch {}
    const w = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    if (!w) {
      // Fallback if popup blocked
      window.location.href = paymentUrl;
    }
  }, [paymentUrl]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => (
        <div key={p.id} className="border rounded p-4 flex flex-col gap-2">
          <div className="font-medium flex items-center text-white gap-2">
            {eventsById?.get(p.event_id || "")?.name || p.pass_name}
          </div>
          {p.description && <div className="text-sm text-gray-300">{p.description}</div>}
          {returningFromPayment ? (
            <button disabled className="mt-2 px-3 py-1 rounded bg-gray-700 text-white opacity-80 cursor-not-allowed">
              Validating...
            </button>
          ) : (
            <button onClick={handlePay} className="mt-2 px-3 py-1 rounded bg-gray-900 text-white hover:bg-black transition">
              Pay
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
