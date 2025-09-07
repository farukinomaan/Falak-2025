"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (pending) return;
        start(async () => {
          try {
            await signOut({ redirect: false });
          } finally {
            // Force client-side nav to avoid any middleware race conditions
            if (typeof window !== "undefined") window.location.assign("/");
            else router.replace("/");
          }
        });
      }}
      className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 pointer-events-auto relative z-50 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: "#E57373", color: "#ffffff" }}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
