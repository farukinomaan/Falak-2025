"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { completeOnboarding } from "./actions";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmationResult | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") signIn("google");
    if (status === "authenticated" && !(session as any).needsOnboarding) {
      router.replace("/");
    }
  }, [status, session, router]);

  // Setup invisible reCAPTCHA once
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch {}
    }
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSending(true);
      const appVerifier = window.recaptchaVerifier!;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmed(result);
      toast.success("OTP sent");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send OTP");
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
      toast.success("Phone verified");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) {
      toast.warning("Verify phone first");
      return;
    }
    try {
      const res = await completeOnboarding({
        name,
        regNo,
        phone,
      });
      if (res.ok) {
        toast.success("Onboarding complete");
        router.replace("/");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Complete your registration</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Registration number</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            required
            placeholder="e.g. MAHE123..."
          />
        </div>
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

        <button
          type="submit"
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={!verified}
        >
          Proceed
        </button>
      </form>

      {/* invisible recaptcha host */}
      <div id="recaptcha-container" />
    </div>
  );
}