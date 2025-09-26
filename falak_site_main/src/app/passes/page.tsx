import Features from "@/components/Features";
import Vinyl from "@/components/profile/Vinyl";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Footer from "@/components/Footer";
import ManualVerifyButton from "@/components/payments/ManualVerifyButton";
import styles from "../profile/page.module.css";

export const revalidate = 60;

type PassCard = {
  id: string;
  pass_name: string;
  description?: string | null;
  cost?: number | string | null;
  event_id?: string | null;
  mahe?: boolean | null; 
};

export default async function PassesPage() {
  const res = await saListProshowPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];

  const session = await getServerSession(authOptions);
  interface SessWithMahe { user?: { mahe?: boolean | null } }
  const isMahe = Boolean((session as SessWithMahe | null)?.user?.mahe);

  const filteredPasses: PassCard[] = (() => {
    if (!session?.user?.email) return []; // guest sees none of the real passes
    if (isMahe) return passes.filter(p => p.mahe !== false);
    return passes.filter(p => p.event_id == null && p.mahe === false);
  })();

  const guestPromo: PassCard[] = !session?.user?.email
    ? [{
        id: "guest-proshow",
        pass_name: "Entertainment Pass",
        description:
          "Witness the soulful magic of Mohit Chauhan live! From timeless hits like Masakali to Tum Se Hi, his mesmerizing voice will make this Pro Show an unforgettable night of music and memories.",
        cost: 849,
        event_id: null,
        mahe: null,
      }]
    : [];

  // Adapt to Features prop shape
  const featurePasses = [...guestPromo, ...filteredPasses].map(p => ({
    id: p.id,
    title: p.pass_name,
    description: p.description || undefined,
    price: typeof p.cost === "number" ? p.cost : Number(p.cost) || 0,
    perks: [],
  }));

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: "url('/cultural.svg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right bottom",
        backgroundAttachment: "fixed",
        backgroundColor: "#32212C",
      }}
    >
      <div className="relative z-20">
        {featurePasses.length > 0 ? (
          <Features passes={featurePasses} isMahe={isMahe} />
        ) : (
          <div className="pt-40 pb-20 text-center text-white relative z-20">
            <h2 className="text-3xl font-semibold mb-4">No passes available</h2>
            <p className="text-sm opacity-80 max-w-md mx-auto">
              Currently no public proshow passes are available for Non-MAHE users.
              Please check back later.
            </p>
          </div>
        )}
      </div>

      {/* Dim the background slightly without affecting foreground */}
      <div
        className="pointer-events-none absolute inset-0  z-10 opacity-30 bg-black"
        aria-hidden
      />

      {/* Decorative wave background replacing vectors */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[60vh] -z-10"
        style={{
          backgroundImage: "url('/wave2.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          opacity: 0.9,
          filter: undefined,
        }}
      />

      {/* Decorative vinyl in bottom-right corner */}
      <div
        className="pointer-events-none absolute right-2 bottom-2 sm:right-6 sm:bottom-6 md:right-10 md:bottom-10 -z-5"
        aria-hidden
        style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))" }}
      >
        <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 opacity-90">
          <Vinyl />
        </div>
      </div>

      <div
        className={styles.infoCard}
        style={{
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          backdropFilter: "blur(6px)",
        }}
      >
        <p style={{ fontSize: 14, lineHeight: 1.4, color: "#e2e8f0" }}>
          <strong style={{ color: "#fff" }}>Note:</strong> If you do not see a pass
          immediately after purchase, do not panic. Please scroll down to footer and
          contact HR, show them your receipt. Devs also have mid-sems—thanks for
          understanding.
        </p>
        <div className="mt-3 mb-1">
          <ManualVerifyButton label="Verify Purchases" />
        </div>
        <span
          className="pl-3"
          style={{ fontSize: 12, lineHeight: 1.8, color: "#e2e8f0" }}
        >
          <p style={{ color: "#fff" }}>Wait a little after clicking</p>
        </span>
      </div>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
