"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
  const [submitting, setSubmitting] = useState(false);
  // Mount guard to avoid SSR/CSR mismatch (session/state driven conditional UI)
  const [mounted, setMounted] = useState(false);
  useRecaptcha();

  useEffect(() => {
    if (status === "authenticated" && !(session as { needsOnboarding?: boolean }).needsOnboarding) {
      router.replace("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering until mounted or session status resolved to prevent hydration warnings
  if (!mounted || status === 'loading') {
    return <div className="min-h-screen" style={{ backgroundColor: '#32212C' }} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (!verified) { toast.warning("Verify phone first"); setSubmitting(false); return; }
    if (!mahe && !institute.trim()) {
      toast.warning("Please enter your college name");
      setSubmitting(false);
      return;
    }
    if (mahe && !regNo.trim()) {
      toast.warning("Registration number is required for MAHE");
      setSubmitting(false);
      return;
    }
    if (mahe) {
      const digits = regNo.replace(/[^0-9]/g, "");
      if (digits.length < 9) {
        toast.warning("Registration number must be at least 9 digits");
        setSubmitting(false);
        return;
      }
    }
    try {
      const payload = {
        name,
        // Store phone as plain digits without country code
        phone: phone.replace(/[^0-9]/g, ""),
        mahe,
        regNo: mahe ? regNo.replace(/[^0-9]/g, "") : null,
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
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden before:absolute before:inset-0 before:bg-black/40 before:pointer-events-none"
        style={{ backgroundColor: '#32212C' }}
      >
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-[#32212C] backdrop-blur-sm rounded-2xl border border-black/20 p-6 text-neutral-50 text-center space-y-4">
            <h1 className="text-2xl font-semibold">Sign in required</h1>
            <p className="text-sm text-neutral-300">Please sign in to complete onboarding.</p>
            <Button onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start')); signIn().finally(() => setTimeout(()=>{ if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop')); }, 8000)); }} className="bg-[#de8c89] hover:bg-[#DBAAA6] text-[#32212C] w-full">Sign in</Button>
          </div>
        </div>
      </div>
    );
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
          // Allow arbitrary length; enforce minimum length (>=9) in submit handler
          setRegNo={(v: string) => setRegNo(v.replace(/[^0-9]/g, ""))}
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
          disabled={!verified || submitting}
          aria-busy={submitting}
        >
          {submitting ? "Processing..." : "Proceed"}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
          <p className="pl-4 text-[10px] sm:text-xs leading-snug text-neutral-400 max-w-xs">
            <span className="font-semibold text-[#DBAAA6]">Note:</span> Registration opens when passes go <span className="text-[#F4CA8E] font-medium">Live</span>. You can logout for now and return later.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-start'));
              signOut({ redirect: false }).finally(() => {
                window.location.assign('/');
                setTimeout(() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('navprogress-stop')); }, 1000);
              });
            }}
            className="relative text-neutral-300 hover:text-[#6a0671] transition-colors duration-200 px-4 py-1 rounded-md overflow-hidden group mr-6"
          >
            <span className="z-10">Logout</span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(219,170,166,0.25), transparent 70%)' }} />
            <span className="absolute inset-0 ring-1 ring-transparent group-hover:ring-[#DBAAA6]/40 rounded-md transition-colors duration-300" />
          </Button>
        </div>
      </form>

  {/* Invisible reCAPTCHA host (required for Firebase phone auth) */}
  <div className="fixed bottom-2 right-2 z-50 pointer-events-none opacity-90" style={{ transform: 'scale(0.85)', transformOrigin: 'bottom right' }}>
    <div id="recaptcha-container" className="pointer-events-auto" />
  </div>
    </div>
    </div>
    </div>
  );
}