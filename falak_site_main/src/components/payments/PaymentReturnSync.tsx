"use client";
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// We'll call an API route (to be created) at /api/payments/sync that invokes forceSyncPayments()
// This component:
// 1. Detects localStorage flag set before redirect (falak_payment_in_progress)
// 2. Calls sync exactly once after mount (and again only if user manually refreshes while flag exists)
// 3. If new passes detected compared to a cached snapshot, shows a centered celebratory popup
// 4. Removes the localStorage flag after successful sync
//
// Assumptions: API returns { ok: true, data: { passes: [...], pending: [...] } }

interface OwnedPassRow {
  passId: string;
  passes?: { pass_name?: string } | null;
  [k: string]: unknown;
}
interface SyncPayload {
  passes: OwnedPassRow[];
  pending: unknown[]; // pending not used for celebration logic
}
interface SyncResponse {
  ok: boolean;
  data?: SyncPayload;
  error?: string;
}

export default function PaymentReturnSync() {
  const started = useRef(false);
  const [celebrate, setCelebrate] = useState<{ passName: string } | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let inProgress = false;
    try { inProgress = localStorage.getItem('falak_payment_in_progress') === '1'; } catch {}
    if (!inProgress) return; // nothing to do

    (async () => {
      let previousOwned: string[] = [];
      try { previousOwned = JSON.parse(localStorage.getItem('falak_owned_pass_ids') || '[]'); } catch {}
      const res = await fetch('/api/payments/sync?force=1', { method: 'POST', headers: { 'content-type': 'application/json' } });
      const json: SyncResponse = await res.json();
      if (!json.ok) {
        toast.error('Payment sync failed. You can retry from Profile.');
        return;
      }
  const newPasses: OwnedPassRow[] = json.data?.passes || [];
      const newIds: string[] = newPasses.map(p => p.passId).filter(Boolean);
      try { localStorage.setItem('falak_owned_pass_ids', JSON.stringify(newIds)); } catch {}
      // Detect any newly acquired pass (choose first difference)
      const gained = newIds.find(id => !previousOwned.includes(id));
      if (gained) {
        // Find pass name
        const pass = newPasses.find(p => p.passId === gained);
        setCelebrate({ passName: pass?.passes?.pass_name || 'New' });
        toast.success('Pass acquired!');
      }
      try { localStorage.removeItem('falak_payment_in_progress'); } catch {}
  try { window.dispatchEvent(new CustomEvent('payments:sync-complete')); } catch {}
    })();
  }, []);

  if (!celebrate) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white text-black rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 pointer-events-auto animate-in fade-in zoom-in">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">Congrats!!</h2>
          <p className="text-base">You just acquired your <span className="font-semibold">{celebrate.passName}</span> pass.</p>
          <div className="pt-2 flex gap-3 justify-center">
            <a href="/profile" className="px-5 py-2 rounded bg-black text-white hover:bg-neutral-800 transition">Go to Profile</a>
            <button onClick={() => setCelebrate(null)} className="px-5 py-2 rounded border border-black hover:bg-black hover:text-white transition">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
