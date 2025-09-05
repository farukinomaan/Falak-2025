import Features from "@/components/Features";
import { saListProshowPasses } from "@/lib/actions/adminAggregations";

export const revalidate = 60;

type PassCard = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };

export default async function PassesPage() {
  const res = await saListProshowPasses();
  const passes: PassCard[] = res.ok ? (res.data as PassCard[]) : [];
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Main content with purple background */}
      <div className="relative z-0">
        <Features passes={passes} />
      </div>
      
                  {/* Vector images ON TOP of the purple background */}
            <div
              className="absolute top-1/2 left-0 w-full h-3/5 z-1"
              style={{
                backgroundImage: "url('/vec5.png')",
                backgroundSize: "100%",
                backgroundPosition: "center bottom",
                backgroundRepeat: "no-repeat"
              }}
            />
            <div
              className="absolute top-1/2 left-0 w-full h-3/5 z-1"
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
