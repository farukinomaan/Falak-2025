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
        // Deprecated: ScanAdminPanel removed in favor of external ticket cutting app.
        export default function ScanAdminPanel() { return null; }
      setError((e as Error).message);
