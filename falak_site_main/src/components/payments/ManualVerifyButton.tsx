"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type OwnedPass = { passId: string; passes?: { pass_name?: string } | null };

interface Props {
  label?: string;
  className?: string;
  compact?: boolean;
  userId?: string; // optional; will fallback to session
}

export default function ManualVerifyButton({ label = "Verify Purchases", className = "", compact = false, userId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Resolve userId if not provided
      let uid = userId;
      if (!uid) {
        try {
          const sres = await fetch('/api/auth/session', { cache: 'no-store' });
          if (sres.ok) {
            const sjson = await sres.json();
            uid = sjson?.user?.id || sjson?.user?.sub || null;
          }
        } catch {}
      }

      let previousOwned: string[] = [];
      try { previousOwned = JSON.parse(localStorage.getItem('falak_owned_pass_ids') || '[]'); } catch {}

      // 1) Try real sync first
  const res = await fetch('/api/payments/sync?force=1', { method: 'POST', headers: { 'content-type': 'application/json' } });
  const json = await res.json().catch(() => null) as { ok?: boolean; data?: { passes?: OwnedPass[] } } | null;

  let newPasses: OwnedPass[] = json?.data?.passes || [];
      const newIds = newPasses.map(p => p.passId).filter(Boolean);
      try { localStorage.setItem('falak_owned_pass_ids', JSON.stringify(newIds)); } catch {}

      const gained = newIds.find(id => !previousOwned.includes(id));
      if (res.ok && json?.ok && gained) {
        const pass = newPasses.find(p => p.passId === gained);
        toast.success(`Pass acquired${pass?.passes?.pass_name ? `: ${pass.passes.pass_name}` : ''}! Redirecting…`);
        setTimeout(() => { window.location.assign('/profile'); }, 1200);
        return;
      }

  // 2) Fallback: attempt dev ingestion route with real fetch for a specific user (requires header)
      if (uid) {
        const tryWithRetries = async (url: string, options: RequestInit, attempts = 6, delayMs = 800) => {
          let last: Response | null = null;
          for (let i = 0; i < attempts; i++) {
            try {
              const r = await fetch(url, options);
              last = r;
              if (r.ok) return r;
            } catch {}
            await new Promise(r => setTimeout(r, delayMs));
          }
          if (last) return last;
          throw new Error('all_attempts_failed');
        };

        // First, real ingestion via dev run endpoint
        const runRes = await tryWithRetries(`/api/dev/payments/run?userId=${encodeURIComponent(uid)}&debug=1`, {
          method: 'GET',
          headers: { 'dev_id': 'iLoveAkshit' },
          cache: 'no-store'
        });
        let runJson: { ok?: boolean; data?: { passes?: OwnedPass[] } } | null = null;
        try { runJson = await runRes.json(); } catch {}
        if (runRes.ok && runJson?.ok) {
          newPasses = runJson.data?.passes || [];
          const ids = newPasses.map((p) => p.passId).filter(Boolean);
          try { localStorage.setItem('falak_owned_pass_ids', JSON.stringify(ids)); } catch {}
          const gained2 = ids.find((id: string) => !previousOwned.includes(id));
          if (gained2) {
            const pass = newPasses.find((p) => p.passId === gained2);
            toast.success(`Pass acquired${pass?.passes?.pass_name ? `: ${pass.passes.pass_name}` : ''}! Redirecting…`);
            setTimeout(() => { window.location.assign('/profile'); }, 1200);
            return;
          }
        }
      }

      toast.info("No passes found. Maybe you already have it, check QR on profile, else drop a message to HR.");
  } catch {
      toast.error("Verification failed. Please try again or contact HR.");
    } finally {
      setLoading(false);
    }
  }, [loading, userId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'} rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ backgroundColor: '#DBAAA6', color: '#32212C' }}
      aria-busy={loading}
    >
      {loading ? 'Verifying…' : label}
    </button>
  );
}
