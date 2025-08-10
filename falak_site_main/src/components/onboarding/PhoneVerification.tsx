"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/firebase";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

interface PhoneVerificationProps {
  phone: string;
  setPhone: (phone: string) => void;
  onVerificationComplete: () => void;
}

export function PhoneVerification({ phone, setPhone, onVerificationComplete }: PhoneVerificationProps) {
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmationResult | null>(null);
  const [verified, setVerified] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSending(true);
      const appVerifier = window.recaptchaVerifier!;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmed(result);
      toast.success("OTP sent");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    try {
      setVerifying(true);
      await confirmed.confirm(otp);
      setVerified(true);
      onVerificationComplete();
      toast.success("Phone verified");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Invalid OTP";
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium">Phone (+91...)</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            required
          />
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={handleSendOtp}
            disabled={sending}
            type="button"
          >
            {sending ? "Sending..." : "Send OTP"}
          </button>
        </div>
      </div>

      {confirmed && !verified && (
        <div>
          <label className="block text-sm font-medium">Enter OTP</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
            />
            <button
              className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
              onClick={handleVerifyOtp}
              disabled={verifying}
              type="button"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
