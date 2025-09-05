"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

interface Props { onVerified: (token: string) => void; }

export function Msg91DirectOtpVerification({ onVerified }: Props) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [presentation, setPresentation] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  async function sendOtp() {
    if (!/^\d{10}$/.test(phone)) { toast.error("Enter valid 10-digit number"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/otp/send-direct", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!data.ok) {
        setLastError(data.error || "Send failed");
        throw new Error(data.error || "Send failed");
      }
      if (data.note) setNote(data.note);
      if (data.presentation) {
        setPresentation(true);
        setNote("Presentation mode: use fixed OTP 123456");
      }
  if (data.dev) {
        setDevMode(true);
        setDevToken(data.devToken);
        toast.success("Dev OTP generated (check server console)");
      } else {
        setDevMode(false);
        setDevToken(null);
        toast.success("OTP sent");
      }
      setSent(true); setCooldown(30);
  } catch (e) { const msg = e instanceof Error ? e.message : "Send failed"; toast.error(msg); } finally { setSending(false); }
  }

  async function verifyOtp() {
    if (otp.length < 4) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify-direct", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, otp, devToken })
      });
      const data = await res.json();
      if (!data.ok) {
        setLastError(data.error || "Invalid OTP");
        throw new Error(data.error || "Invalid OTP");
      } else {
        setLastError("");
      }
      onVerified(data.phoneVerificationToken); toast.success("Phone verified");
  } catch (e) { const msg = e instanceof Error ? e.message : "Verify failed"; toast.error(msg); } finally { setVerifying(false); }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number (+91)</label>
        <div className="flex gap-2">
          <Input
            disabled={verifying}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0,10))}
            placeholder="98xxxxxxxx"
            className="flex-1"
          />
          <Button type="button" variant="outline" disabled={sending || cooldown>0} onClick={sendOtp} className="bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C]">
            {sending ? "Sending..." : cooldown>0 ? `Resend (${cooldown})` : sent ? "Resend" : "Send OTP"}
          </Button>
        </div>
      </div>
  {sent && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Enter OTP</label>
          <div className="flex items-center gap-2">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button type="button" disabled={verifying || otp.length<4} onClick={verifyOtp}>
              {verifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
          {devMode && <p className="text-[10px] text-blue-600">Dev mode: OTP logged in server console.</p>}
          {presentation && <p className="text-[10px] text-purple-600">Presentation mode active.</p>}
          {devMode && devToken && process.env.NODE_ENV !== 'production' && (
            <details className="text-[10px] text-muted-foreground">
              <summary>debug token</summary>
              <div className="break-all">{devToken.slice(0,60)}…</div>
            </details>
          )}
        </div>
      )}
      {lastError && <p className="text-[10px] text-red-600">{lastError}</p>}
  {note && !lastError && <p className="text-[10px] text-blue-600">{note}</p>}
    </div>
  );
}
