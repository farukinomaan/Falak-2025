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
          await signOut({ redirect: false });
          window.location.href = "/"; 
          toast.success("Signed out");
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
        //  const res = await signIn("google", { callbackUrl: "/" });
        await signIn("google", { callbackUrl: "/" });
        // if (res === undefined) {
        //   toast.info("Sign-in flow opened");
        // }
      }}
    >
      Sign in with Google
    </button>
  );
}

