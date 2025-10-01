"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// We will dynamically import a lightweight qr scanner library only on client
// Using html5-qrcode (small, widely used). If not installed yet, you'd need to add it to package.json.
// For now we'll code-split and only attempt import in browser; fallback to manual input.

interface ScanResultData {
  userId: string; userName: string | null; userPhone: string | null; userRegNo: string | null; userMahe: boolean; userCollege: string | null; passId: string; pass_name: string | null; event_id: string | null; mahe_only: boolean | null; issued_at: string; qr_token: string;
}

// Basic modal overlay
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-neutral-400 hover:text-white" aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  );
}

export default function ScanAdminPanel() {
  const [supported, setSupported] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  // Lazy scanner mount (avoid SSR issues)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.mediaDevices) {
      setSupported(true);
    }
  }, []);

  // Minimal inline scanner using native APIs instead of external lib to avoid adding dependency for now.
  // Strategy: use getUserMedia to show video, draw frames to canvas, attempt ZXing decode via dynamic import if user wants to start scanning.
  // To keep this lightweight, we implement manual token input + optional future enhancement with real lib.

  async function lookupToken(token: string) {
    if (!token) { toast.error('No token'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/qr/verify-full?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error || 'lookup_failed');
        toast.error(j.error || 'Lookup failed');
      } else {
        setResult(j.data as ScanResultData);
        setOpen(true);
        toast.success('Pass verified');
      }
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupToken(manualToken.trim());
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Scan / Verify Pass</h2>
      <p className="text-sm text-neutral-400">Scan a QR from a user&apos;s pass to view ownership details. Only visible to scan-enabled admin roles.</p>
      <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
        <Input placeholder="Paste or type QR token" value={manualToken} onChange={e=>setManualToken(e.target.value)} className="flex-1" />
        <Button type="submit" disabled={loading || !manualToken.trim()}>{loading ? 'Verifying...' : 'Verify'}</Button>
      </form>
      {!supported && (
        <p className="text-xs text-yellow-400">Camera API not supported in this browser; use manual token entry.</p>
      )}
      {/* Placeholder for future live camera scanner (can integrate html5-qrcode or @zxing/browser) */}
      <div className="border border-neutral-700 rounded p-4 text-neutral-400 text-sm bg-neutral-900/40">
        Live camera scanning not yet integrated. Paste the token shown under the QR code. (We can add camera support later.)
      </div>

      <Modal open={open} onClose={()=>setOpen(false)}>
        {result ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pass Holder</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-neutral-400">User ID</div><div className="font-mono break-all">{result.userId}</div>
              <div className="text-neutral-400">Name</div><div>{result.userName || '—'}</div>
              <div className="text-neutral-400">Phone</div><div>{result.userPhone || '—'}</div>
              <div className="text-neutral-400">Reg No</div><div>{result.userRegNo || '—'}</div>
              <div className="text-neutral-400">MAHE</div><div>{result.userMahe ? 'Yes' : 'No'}</div>
              <div className="text-neutral-400">College</div><div>{result.userCollege || '—'}</div>
              <div className="text-neutral-400">Pass</div><div>{result.pass_name || result.passId}</div>
              <div className="text-neutral-400">Event ID</div><div>{result.event_id || '—'}</div>
              <div className="text-neutral-400">Issued At</div><div>{new Date(result.issued_at).toLocaleString()}</div>
              <div className="text-neutral-400">Token</div><div className="font-mono text-xs break-all">{result.qr_token}</div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" type="button" onClick={()=>setOpen(false)}>Close</Button>
            </div>
          </div>
        ) : error ? <p className="text-red-400 text-sm">{error}</p> : <p className="text-sm text-neutral-400">No result</p>}
      </Modal>
    </div>
  );
}
