import Features from "@/components/Features";
import Vinyl from "@/components/profile/Vinyl";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Footer from "@/components/Footer";

export const revalidate = 60;

type PassCard = {
  id: string;
  pass_name: string;
  description?: string | null;
  cost?: number | string | null;
  event_id?: string | null;
  mahe?: boolean | null; // true=MAHE pass, false=Non-MAHE only, undefined => open
};

// Passes now live (flag removed; always show passes)

export default async function PassesPage() {
  const res = await saListProshowPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];
  // Determine if current user is MAHE from enriched session (avoids extra DB round trip)
  const session = await getServerSession(authOptions);
  interface SessWithMahe { user?: { mahe?: boolean | null } }
  const isMahe = Boolean((session as SessWithMahe | null)?.user?.mahe);

  // When passes go live, use this filtered list
  // Visibility rules UPDATED:
  // - Enabled filtering handled upstream.
  // - MAHE user: show all passes except those explicitly non-MAHE (mahe === false)
  // - Non-MAHE user (mahe === false): show ONLY public proshow passes => event_id IS NULL AND mahe === false
  // - Guest (no session): show all (marketing visibility) – adjust later if needed
  const filteredPasses: PassCard[] = (() => {
    if (!session?.user?.email) return passes; // guest sees all
    if (isMahe) return passes.filter(p => p.mahe !== false);
    // Non-MAHE user: strictly public proshow passes (no event tie + mahe === false)
    return passes.filter(p => p.event_id == null && p.mahe === false);
  })();

  // Adapt to Features prop shape
  const featurePasses = filteredPasses.map(p => ({
    id: p.id,
    title: p.pass_name,
    description: p.description || undefined,
    price: typeof p.cost === 'number' ? p.cost : Number(p.cost) || 0,
    perks: [],
  }));
  
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
  // Use the cultural events background and shift vinyl to bottom-right
  backgroundImage: "url('/cultural.svg')",
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right bottom',
  backgroundAttachment: 'fixed',
  backgroundColor: '#32212C',
      }}
    >

      <div className="relative z-20">
  {featurePasses.length > 0 ? (
    <Features passes={featurePasses} isMahe={isMahe} />
  ) : (
    <div className="pt-40 pb-20 text-center text-white relative z-20">
      <h2 className="text-3xl font-semibold mb-4">No passes available</h2>
      <p className="text-sm opacity-80 max-w-md mx-auto">Currently no public proshow passes are available for Non-MAHE users. Please check back later.</p>
    </div>
  )}
      </div>


      {/* Dim the background slightly without affecting foreground */}
      <div
        className="pointer-events-none absolute inset-0  z-10 opacity-30 bg-black"
        aria-hidden
      />

      {/* Decorative wave background replacing vectors, blurred in COMING SOON mode */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[60vh] -z-10"
        style={{
          backgroundImage: "url('/wave2.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          opacity: 0.9,

          filter: undefined

        }}
      />

      {/* Decorative vinyl in bottom-right corner */}
      <div
        className="pointer-events-none absolute right-2 bottom-2 sm:right-6 sm:bottom-6 md:right-10 md:bottom-10 -z-5"
        aria-hidden
        style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}
      >
        <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 opacity-90">
          <Vinyl />
        </div>
      </div>
      <div className="relative z-20">
  <Footer />
</div>

    </div>
  );
}
// Checkpoint commit