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
  // Deprecated direct phone input removed (Firebase flow).
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [mahe, setMahe] = useState<boolean>(true);
  const [institute, setInstitute] = useState("");
  const [verified, setVerified] = useState(false);
  const [phone, setPhone] = useState("");
  useRecaptcha();

  useEffect(() => {
    if (status === "unauthenticated") signIn("google");
    if (status === "authenticated" && !(session as { needsOnboarding?: boolean }).needsOnboarding) {
      router.replace("/");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  if (!verified) { toast.warning("Verify phone first"); return; }
    if (!mahe && !institute.trim()) {
      toast.warning("Please enter your college name");
      return;
    }
    if (mahe && !regNo.trim()) {
      toast.warning("Registration number is required for MAHE");
      return;
    }
    try {
      const payload = {
        name,
  phone: "+91" + phone.replace(/[^0-9]/g, ""),
        mahe,
        regNo: mahe ? regNo : null,
        institute: mahe ? null : institute.trim(),
      };
      const res = await completeOnboarding(payload);
      if (res.ok) {
        toast.success("Onboarding complete");
        // Let the toast show briefly, then refresh.
        // The auth effect will redirect to home after refresh if onboarding is done.
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 1200);
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  return (
<div
    className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden before:absolute before:inset-0 before:bg-black/40 before:pointer-events-none"
    style={{ backgroundColor: '#32212C' }}
  >
    {/* Background SVG */}
    <div 
      className="absolute pointer-events-none inset-0"
      style={{
        backgroundImage: 'url(/background.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover', // or 'contain' depending on your preference
        backgroundPosition: 'center',
        opacity: 0.5, // Adjust opacity so it doesn't overpower content
        zIndex: 0, // Behind the overlay
      }}
    />
    
  <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
    <div className="bg-[#32212C] backdrop-blur-sm rounded-2xl border border-black/20 p-6 sm:p-8 md:p-10 text-neutral-50">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-center">
        Complete your registration
      </h1>

  <form className="space-y-4" onSubmit={handleSubmit}>
        <RegistrationForm
          name={name}
          setName={setName}
          regNo={regNo}
          setRegNo={setRegNo}
          mahe={mahe}
          setMahe={setMahe}
          institute={institute}
          setInstitute={setInstitute}
        />
        <div>
          <PhoneVerification
            phone={phone}
            setPhone={(p) => setPhone(p.replace(/[^0-9]/g, "").slice(0,10))}
            onVerificationComplete={() => setVerified(true)}
          />
        </div>

        <Button
          type="submit"
          variant={"default"}
          className=" disabled:bg-gray-600 bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C]"
          disabled={!verified}
        >
          Proceed
        </Button>
      </form>

  {/* Invisible reCAPTCHA host (required for Firebase phone auth) */}
  <div id="recaptcha-container" />
    </div>
    </div>
    </div>
  );
}