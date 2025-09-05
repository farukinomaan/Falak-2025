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
        // Force session refresh so needsOnboarding updates before navigating
        // next-auth v4: call getSession via window focus hack
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("focus"));
        }
        router.replace("/");
        router.refresh(); // TL-DR:- Fcker aint working

        // Abhi ke liye hard reload
        window.location.reload();
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  return (
    <div style={{ backgroundColor: '#32212C' }} className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden">
      {/* Background with External SVG */}
      <div 
  className="absolute pointer-events-none"
  style={{
    backgroundImage: 'url(/waves.svg)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1703.5px 458.7px',
    width: '1703.5px',
    height: '558.7px',
    left: '-115px',
    top: '420px', // for bottom alignment
  }}
/>
  <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
    <div className="bg-[#191919]/95 backdrop-blur-sm rounded-2xl border border-black/20 p-6 sm:p-8 md:p-10 text-neutral-50">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-center">
        Complete your registration
      </h1>

      <form className="space-y-4" onSubmit={
        // handleSubmit
        (e) => { e.preventDefault(); toast.info("Backend logic commented out."); }
      }>
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
          className=" disabled:bg-gray-600 bg-[#DBAAA6] w-full hover:bg-[#de8c89] text-[#32212C]"
          disabled={verified}
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