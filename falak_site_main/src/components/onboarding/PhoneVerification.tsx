"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/firebase";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { RecaptchaVerifier } from "firebase/auth/web-extension";

interface PhoneVerificationProps {
  phone: string;
  setPhone: (phone: string) => void;
  onVerificationComplete: () => void;
}

export function PhoneVerification({ phone, setPhone, onVerificationComplete }: PhoneVerificationProps) {
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [recaptchaVerifier,setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
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
          <Input
            className="flex-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            required
          />
          <Button onClick={handleSendOtp} disabled={sending} type="button" variant="outline">
            {sending ? "Sending..." : "Send OTP"}
          </Button>
        </div>
      </div>

      {confirmed && !verified && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Enter OTP</label>
          <div className="flex justify-between">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>

                <InputOTPSeparator></InputOTPSeparator>
                
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
            <Button onClick={handleVerifyOtp} disabled={verifying} type="button">
              {verifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
