import Features from "@/components/Features";
import Vinyl from "@/components/profile/Vinyl";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions";
import type { User } from "@/lib/actions";

export const revalidate = 60;

type PassCard = {
  id: string;
  pass_name: string;
  description?: string | null;
  cost?: number | string | null;
  event_id?: string | null;
  mahe?: boolean | null; // true=MAHE pass, false=Non-MAHE only, undefined => open
};

// Toggle when passes go live
const PASSES_SALES_ACTIVE = false;

export default async function PassesPage() {
  const res = await saListProshowPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];
  // Determine if current user is MAHE
  const session = await getServerSession(authOptions);
  let isMahe = false;
  if (session?.user?.email) {
    try {
      const u = await getUserByEmail(session.user.email);
      if (u.ok && u.data) {
        const user = u.data as User;
        isMahe = Boolean(user.mahe);
      }
    } catch {}
  }

  // When passes go live, use this filtered list
  // Visibility rules:
  // - Only enabled passes are fetched at the API level.
  // - If user.mahe === true => hide passes where pass.mahe === false (Non-MAHE only)
  // - If user.mahe === false => hide passes where event_id is null AND pass.mahe === true (MAHE-only proshow)
  // - If unauthenticated/unregistered => show all
  const filteredPasses: PassCard[] = (() => {
    if (!session?.user?.email) return passes; // guest: show all
    if (isMahe) return passes.filter((p) => p.mahe !== false);
    return passes.filter((p) => !(p.event_id == null && p.mahe === true));
  })();
  
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
      {/* Passes COMING SOON overlay; keep data fetching for later */}
      {PASSES_SALES_ACTIVE ? (
        // TODO: When passes go live, remove this condition and render Features below
        <div className="relative z-20 ">
      {/* Switch to filteredPasses to enforce MAHE visibility rules */}
      <Features passes={filteredPasses} isMahe={isMahe} />
        </div>
      ) : (
        <div className="relative z-20 flex items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-2xl">
            <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-2xl px-6 py-10 sm:px-10">
              <div className="text-center space-y-3">
                <span className="inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80">Passes</span>
                <h1 className="vintage-font text-4xl sm:text-5xl md:text-6xl font-semibold tracking-wide text-white">COMING SOON</h1>
                <p className="text-white/70">Proshow and event passes will be available here soon.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          filter: PASSES_SALES_ACTIVE ? undefined : 'blur(1.5px)'
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
    </div>
  );
}
// Checkpoint commit