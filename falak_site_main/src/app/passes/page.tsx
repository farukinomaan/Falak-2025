import Features from "@/components/Features";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";

export const revalidate = 60;

type PassCard = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

export default async function PassesPage() {
  const res = await saListProshowPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];
  
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        // Use the provided SVG as the page background
        backgroundImage: "url('/background.svg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center top'
      }}
    >
      {/* Main content with purple background */}
      <div className="relative z-20 ">
        <Features passes={passes} />
      </div>

      {/* Background decorative vectors (non-interactive) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[55vh] -z-10"
        style={{
          backgroundImage: "url('/vec5.png')",
          backgroundSize: "100%",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat"
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[60vh] -z-20"
        style={{
          backgroundImage: "url('/vec4.png')",
          backgroundSize: "100%",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat"
        }}
      />
    </div>
  );
}
