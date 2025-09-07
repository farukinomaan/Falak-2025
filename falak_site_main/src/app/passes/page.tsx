import Features from "@/components/Features";
import Vinyl from "@/components/profile/Vinyl";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions";
import type { User } from "@/lib/actions";

export const revalidate = 60;

type PassCard = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

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
  
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
  // Use the cultural events background and shift vinyl to bottom-right
  backgroundImage: "url('/cultural.svg')",
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right bottom',
  backgroundAttachment: 'fixed'
      }}
    >
      {/* Main content with purple background */}
      <div className="relative z-20 ">
        <Features passes={passes} isMahe={isMahe} />
      </div>

      {/* Dim the background slightly without affecting foreground */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/50 z-10"
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
          opacity: 0.9
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
