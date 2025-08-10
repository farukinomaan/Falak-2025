"use client";

import { useEffect } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export function useRecaptcha() {
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch {
        // Ignore errors during setup
      }
    }
  }, []);
}
