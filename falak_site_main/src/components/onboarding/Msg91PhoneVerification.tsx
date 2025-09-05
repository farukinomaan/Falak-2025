"use client";

// Component wrapping MSG91 OTP widget script. After successful verification it obtains an access-token
// and calls our server route to exchange it for an internal phoneVerificationToken.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Msg91DirectOtpVerification } from "@/components/onboarding/Msg91DirectOtpVerification"; // fallback manual flow

interface Props {
  onVerified: (token: string) => void;
  /** allow toggling sending identifier directly vs letting widget collect */
  withIdentifier?: boolean;
}

type Msg91WidgetConfig = {
  widgetId: string;
  tokenAuth: string;
  exposeMethods?: boolean;
  success: (data: Record<string, unknown>) => void;
  failure: (error: unknown) => void;
};

declare global {
  interface Window {
    initSendOTP?: (config: Msg91WidgetConfig) => void;
  }
}

export function Msg91PhoneVerification({ onVerified, withIdentifier = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [phone, setPhone] = useState(""); // 10-digit local Indian number
  const scriptLoadedRef = useRef(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [debugMsg, setDebugMsg] = useState<string>("");
  const [lastFailure, setLastFailure] = useState<string>("");
  const [failureCount, setFailureCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // You must supply widgetId & tokenAuth.
  // widgetId comes from MSG91 dashboard.
  // tokenAuth: either static or fetched from a backend route if dynamic – here we read from env (public) as a starting point.
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH; // Replace with API call if secret.

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-msg91-widget="true"]');
    if (existing) {
      scriptLoadedRef.current = true;
      setDebugMsg("Script tag already present");
      if (window.initSendOTP) {
        setWidgetReady(true);
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;
    script.dataset.msg91Widget = "true";
    script.onload = () => {
      scriptLoadedRef.current = true;
      setDebugMsg("Script loaded; polling for initSendOTP");
      // Poll for up to 3s in case script attaches late
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        if (window.initSendOTP) {
          setWidgetReady(true);
          setDebugMsg(prev => prev + " | initSendOTP ready");
          clearInterval(iv);
        } else if (tries > 30) {
          setDebugMsg(prev => prev + " | initSendOTP missing after poll");
          clearInterval(iv);
        }
      }, 100);
    };
    script.onerror = () => {
      setDebugMsg("Failed to load MSG91 script");
      toast.error("Failed to load OTP widget script");
    };
    document.body.appendChild(script);
  }, []);

  function normalizePhone(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return "+91" + digits; // assume India
    if (digits.startsWith("+")) return digits;
    return "+" + digits;
  }

  async function startWidget() {
    if (!widgetId || !tokenAuth) {
      setDebugMsg("Missing widgetId or tokenAuth env vars");
      toast.error("OTP widget not configured");
      return;
    }
    // Basic heuristics: tokenAuth should not be the full server AUTH KEY (avoid exposing it)
    if (tokenAuth && tokenAuth.startsWith("AK") && tokenAuth.length > 25) {
      setDebugMsg(prev => prev + " | Warning: tokenAuth looks like a server AUTH KEY; generate a widget token instead");
    }
    if (!window.initSendOTP) {
      toast.error("OTP script not ready yet");
      setDebugMsg("initSendOTP missing on click");
      return;
    }
    // Validate phone before launching widget so we control format
    let normalized: string | undefined;
    if (withIdentifier) {
      if (!/^\d{10}$/.test(phone)) {
        toast.error("Enter valid 10-digit number");
        return;
      }
      normalized = normalizePhone(phone);
    }
    setLoading(true);
    try {
      // Extra runtime diagnostics
      setDebugMsg(prev => `${prev} | preparingConfig(wid:${widgetId?.slice(-4)},tok:${tokenAuth?.slice(0,4)}...)`);
      const configuration = {
        widgetId,
        tokenAuth,
        ...(withIdentifier && normalized ? { identifier: normalized } : {}),
        // Attempt to mount widget in dedicated container if supported
        container: document.getElementById("msg91-otp-root") || undefined,
        exposeMethods: true,
        success: async (data: Record<string, unknown>) => {
          try {
            const d = data as Record<string, unknown>;
            const rawTok = ["token", "accessToken", "access-token"].map(k => {
              const v = d[k];
              return typeof v === "string" ? v : undefined;
            }).find(Boolean);
      if (typeof rawTok !== "string" || rawTok.length < 10) throw new Error("No access token returned");
      const accessTok: string = rawTok;
      setAccessToken(accessTok);
            setDebugMsg(prev => prev + " | successCallback");
            const res = await fetch("/api/otp/verify-widget", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken: accessTok })
            });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error || "Verification failed");
            setVerified(true);
            onVerified(json.phoneVerificationToken);
            toast.success("Phone verified");
          } catch (err) {
            const message = err instanceof Error ? err.message : "Verification failed";
            toast.error(message);
          }
        },
        failure: (error: unknown) => {
          // Safe, shallow serialization to avoid circular refs
          const describe = (err: unknown): string => {
            if (err == null) return "<null>";
            if (typeof err === "string") return err;
            if (err instanceof Error) return `${err.name}: ${err.message}`;
            if (typeof err === "object") {
              const entries: string[] = [];
              try {
                Object.keys(err as Record<string, unknown>).slice(0, 10).forEach(k => {
                  try {
                    const v = (err as Record<string, unknown>)[k];
                    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                      entries.push(`${k}=${v}`);
                    } else if (Array.isArray(v)) {
                      entries.push(`${k}=[array:${v.length}]`);
                    } else if (v && typeof v === "object") {
                      entries.push(`${k}=[object]`);
                    } else if (v === null) {
                      entries.push(`${k}=null`);
                    }
                  } catch {}
                });
              } catch {}
              return entries.length ? `object{${entries.join(",")}}` : "object{}";
            }
            return String(err);
          };
          const serialized = describe(error);
          setLastFailure(serialized);
          setFailureCount(fc => fc + 1);
          setDebugMsg(prev => prev + " | failureCallback");
          console.error("MSG91 widget failure", error);
          toast.error("OTP failed");
          // Common hints
          if (/IPBlocked/i.test(serialized)) {
            setDebugMsg(prev => prev + " | Hint: Whitelist domain/IP in MSG91 & ensure using widget token, not auth key");
          }
          if (/Unauthorised|Unauthorized|401/.test(serialized)) {
            setDebugMsg(prev => prev + " | Hint: tokenAuth invalid or expired");
          }
          // Auto fallback after 2 distinct failures (before verification success)
          setTimeout(() => {
            setShowFallback(sc => sc || !verified && (failureCount + 1) >= 2);
          }, 50);
        },
      };
      // Kick off widget flow
      if (window.initSendOTP) {
        setDebugMsg(prev => prev + " | callingInitSendOTP");
        try {
          const maybePromise: unknown = window.initSendOTP(configuration as Msg91WidgetConfig);
          if (maybePromise && typeof maybePromise === 'object' && 'then' in maybePromise && typeof (maybePromise as { then?: unknown }).then === 'function') {
            (maybePromise as Promise<unknown>).then(() => {
              setDebugMsg(prev => prev + " | initSendOTP resolved");
            }).catch(e => {
              setDebugMsg(prev => prev + " | initSendOTP rejected");
              console.error("initSendOTP promise rejection", e);
            });
          }
        } catch (e) {
          setDebugMsg(prev => prev + " | initSendOTP threw");
          console.error("initSendOTP threw", e);
          toast.error("Widget init error");
        }
      } else {
        setDebugMsg("initSendOTP disappeared before call");
        toast.error("OTP init function missing");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {withIdentifier && (
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number (+91)</label>
          <div className="flex gap-2">
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              disabled={verified || loading}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="98xxxxxxxx"
              className="flex-1"
            />
            <Button
              type="button"
              variant={verified ? "default" : "outline"}
              disabled={loading || verified}
              onClick={startWidget}
              className="disabled:bg-gray-600 bg-[#DBAAA6] hover:bg-[#de8c89] m-2 text-black"
            >
              {verified ? "Verified" : loading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        </div>
      )}
  {!withIdentifier && (
        <Button
          type="button"
          variant={verified ? "default" : "outline"}
          disabled={loading || verified || !widgetReady}
          onClick={startWidget}
          className="disabled:bg-gray-600 bg-[#DBAAA6] hover:bg-[#de8c89] m-2 text-black"
        >
          {verified ? "Verified" : loading ? "Starting..." : widgetReady ? "Start Verification" : "Loading widget..."}
        </Button>
      )}
      {/* Container (in case widget needs an inline mount) */}
      <div id="msg91-otp-root" className="min-h-0" />
      {accessToken && !verified && (
        <p className="text-xs text-muted-foreground">OTP sent. Complete verification in widget...</p>
      )}
      {verified && <p className="text-xs text-green-600">Phone verified</p>}
      {process.env.NODE_ENV !== "production" && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground break-all">Debug: {debugMsg} | ready:{widgetReady ? "yes" : "no"} | wid:{widgetId? widgetId.slice(-4):'NA'} tk:{tokenAuth? tokenAuth.slice(0,4)+'…':'NA'}</p>
          {lastFailure && (
            <pre className="text-[10px] bg-muted/30 p-1 rounded overflow-x-auto max-h-24">Failure: {lastFailure}</pre>
          )}
          {!withIdentifier && !verified && (
            <p className="text-[10px] text-amber-500">Identifier disabled (withIdentifier=false). If widget expects number pre-supplied it may silently fail.</p>
          )}
          {(!widgetReady && scriptLoadedRef.current) && (
            <p className="text-[10px] text-red-500">Script loaded but initSendOTP not found – possible CSP/adblock or wrong script URL.</p>
          )}
          {showFallback && !verified && (
            <p className="text-[10px] text-blue-600">Switching to fallback manual OTP due to repeated widget failures.</p>
          )}
        </div>
      )}
      {showFallback && !verified && (
        <div className="border rounded p-3 space-y-2 bg-muted/20">
          <p className="text-xs font-medium">Fallback Verification</p>
          <Msg91DirectOtpVerification onVerified={(t) => { onVerified(t); setVerified(true); }} />
        </div>
      )}
    </div>
  );
}
