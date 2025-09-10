"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";

export default function AuthButtons() {
  const { data: session } = useSession();
  if (session) {
    return (
      <button
        className="text-sm"
        onClick={async () => {
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start'));
          await signOut({ redirect: false });
          window.location.href = "/"; 
          toast.success("Signed out");
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop'));
        }}
      >
        Sign out
      </button>
    );
  }
  return (
    <button
      className="text-sm"
      onClick={async () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start'));
        await signIn("google", { callbackUrl: "/" });
        setTimeout(() => {
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop'));
        }, 8000);
        // if (res === undefined) {
        //   toast.info("Sign-in flow opened");
        // }
      }}
    >
      Sign in with Google
    </button>
  );
}

