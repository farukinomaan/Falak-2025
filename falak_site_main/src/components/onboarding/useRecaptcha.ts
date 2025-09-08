"use client";

import { useEffect } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  }
}

export function useRecaptcha() {
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          // Fire when reCAPTCHA gets a token; phone auth will consume it automatically
          callback: () => {},
          // Optional: handle token expiry
          "expired-callback": () => {},
          // badge: "bottomright", // tweak badge position if needed
        });
        window.recaptchaVerifier = verifier;
        // Render once and cache widget id so we can reuse/reset if ever needed
        verifier.render().then((widgetId) => {
          window.recaptchaWidgetId = widgetId;
        });
      } catch {
        // Ignore errors during setup
      }
    }

    // Dev-only: skip app verification for whitelisted test numbers
    // if (process.env.NODE_ENV !== "production") {
    //   // @ts-expect-error internal API
    //   auth.settings.appVerificationDisabledForTesting = true;
    // }
  }, []);
}
