"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding } from "./actions";
import { RegistrationForm } from "@/components/onboarding/RegistrationForm";
// To re-enable OTP in the future, uncomment these imports and the blocks below:
// import { PhoneVerification } from "@/components/onboarding/PhoneVerification";
// import { useRecaptcha } from "@/components/onboarding/useRecaptcha";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Deprecated direct phone input removed (Firebase flow).
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [mahe, setMahe] = useState<boolean>(true);
  const [institute, setInstitute] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Mount guard to avoid SSR/CSR mismatch (session/state driven conditional UI)
  const [mounted, setMounted] = useState(false);

  // Determine intended return path from query (?return=/some/path)
  const [returnPath, setReturnPath] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const ret = url.searchParams.get('return');
      if (ret && ret.startsWith('/')) setReturnPath(ret);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !(session as { needsOnboarding?: boolean }).needsOnboarding) {
      router.replace(returnPath || "/");
    }
  }, [status, session, router, returnPath]);

  // useRecaptcha(); // <— re-enable when restoring OTP
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
    // OTP disabled: allow direct registration with provided number
    if (!mahe && !institute.trim()) {
      toast.warning("Please enter your college name");
      setSubmitting(false);
      return;
    }
    if (mahe && !regNo.trim()) {
      toast.warning("Registration number is required for MAHE BLR");
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
    if (!mahe && !institute.trim()) {
      toast.warning("Please enter your college name. If you are not a college student,you are not eligible to participate in fest.");
      setSubmitting(false);
      return;
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
        // Force refresh session so needsOnboarding flips before navigation
        try { await fetch('/api/auth/session?update=' + Date.now(), { cache: 'no-store' }); } catch {}
        setTimeout(() => {
          router.replace(returnPath || "/");
        }, 400);
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
              {/* OTP flow (disabled). To restore, replace the block below with PhoneVerification
              <PhoneVerification
                phone={phone}
                setPhone={(p) => setPhone(p.replace(/[^0-9]/g, "").slice(0,10))}
                onVerificationComplete={() => setVerified(true)}
              />
              */}
              {/* Simple phone input (active while OTP is off) */}
          <label className="block text-sm font-medium">Billing Phone </label>
          <input
            className="w-full border rounded px-3 py-2 bg-black/20 border-white/20 text-white placeholder:text-neutral-400"
            type="tel"
            value={phone}
            onChange={(e)=> setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0,10))}
            placeholder="98XXXXXX01"
            required
          />
          <p className="text-[10px] sm:text-xs leading-snug text-red-500 max-w-xs">
            <span className="font-semibold text-[#DBAAA6]">Note:</span> Enter the number you will use on the payment portal. Discrepancies may cause issues.
          </p>
        </div>

        <Button
          type="submit"
          variant={"default"}
          className=" disabled:bg-gray-600 bg-[#de8c89] w-full hover:bg-[#DBAAA6] text-[#32212C]"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Processing..." : "Proceed"}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
          <p className="pl-4 text-[10px] sm:text-xs leading-snug text-neutral-400 max-w-xs">
            <span className="font-semibold text-[#DBAAA6]">Note:</span> Refresh if you see this page again after regestraion.
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


    </div>
    </div>
    </div>
  );
}