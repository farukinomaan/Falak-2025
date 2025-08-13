"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding } from "./actions";
import { RegistrationForm } from "@/components/onboarding/RegistrationForm";
import { PhoneVerification } from "@/components/onboarding/PhoneVerification";
import { useRecaptcha } from "@/components/onboarding/useRecaptcha";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [verified, setVerified] = useState(false);

  useRecaptcha();

  useEffect(() => {
    if (status === "unauthenticated") signIn("google");
    if (status === "authenticated" && !(session as { needsOnboarding?: boolean }).needsOnboarding) {
      router.replace("/");
    }
  }, [status, session, router]);

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
        <RegistrationForm
          name={name}
          setName={setName}
          regNo={regNo}
          setRegNo={setRegNo}
        />
        
        <div>
          {/* <label className="block text-sm font-medium text-gray-700">
            Enter the OTP sent to your phone
          </label> */}
          <PhoneVerification
            phone={phone}
            setPhone={setPhone}
            onVerificationComplete={() => setVerified(true)}
          />
        </div>

        <Button
          type="submit"
          variant={"default"}
          className=" disabled:opacity-50"
          disabled={!verified}
        >
          Proceed
        </Button>
      </form>

      {/* invisible recaptcha host */}
      <div id="recaptcha-container" />
    </div>
  );
}