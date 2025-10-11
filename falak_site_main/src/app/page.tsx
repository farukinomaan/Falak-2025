import dynamic from "next/dynamic";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { Orbitron } from "next/font/google";
const Hero = dynamic(() => import("@/components/Hero"));
const Artist = dynamic(() => import("@/components/Artist"));
const Artist2 = dynamic(() => import("@/components/Artist2"));
const Timeline = dynamic(() => import("@/components/Timeline"));
const Trailer = dynamic(() => import("@/components/Trailer"));
const About = dynamic(() => import("@/components/About"));
const Sponsor = dynamic(() => import("@/components/Sponsor"));
const BackgroundLayers = dynamic(() => import("@/components/BackgroundLayers"));

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export default function Home() {
  return (
    <div className={orbitron.className}>
  {/* Preload critical media via metadata in layout if needed */}

      {/* Background Layers with smooth fade-in */}
      <BackgroundLayers />

      {/* Grain Overlay (optional) */}
      {/* <div className="grain-overlay"></div> */}

      

      {/* Page content */}
      <div className="relative z-10">
  <Suspense fallback={<SectionSkeleton title="Welcome" />}> <Hero /> </Suspense>
  {/* <Suspense fallback={<SectionSkeleton title="Welcome" />}> <Timer /> </Suspense> */}
  <Suspense fallback={<SectionSkeleton title="About" />}> <About /> </Suspense>
{/* Before Artist2 */}
<Suspense fallback={<SectionSkeleton title="Artist" />}>
  <div className="-mb-[50vh] relative z-20">
    <Artist />
  </div>
</Suspense>

{/* Scroll buffer BEFORE Artist2 */}
<div className="h-[50vh] w-full bg-transparent" aria-hidden="true" />

<Suspense fallback={<SectionSkeleton title="Artist2" />}>
  <Artist2 />
</Suspense>

{/* Scroll buffer AFTER Artist2 */}
<div className="h-[50vh] w-full bg-transparent" aria-hidden="true" />

{/* After Artist2 */}
<Suspense fallback={<SectionSkeleton title="Timeline" />}>
  <div className="-mt-[50vh] relative z-20">
    <Timeline />
  </div>
</Suspense>

  <Suspense fallback={<SectionSkeleton title="Trailer" />}> <Trailer /> </Suspense>
  <Suspense fallback={<SectionSkeleton title="Sponsors" />}> <Sponsor /> </Suspense>
  <Footer />
</div>


    </div>
  );
}

export const metadata = {
  title: "FALAK 2025",
  description: "MIT Bengaluru Cultural fest"
};

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="w-full py-16 px-4">
      <div className="max-w-[1100px] mx-auto">
        <div className="h-6 w-40 mb-6 rounded bg-[#DBAAA6]/20" aria-hidden />
        <div className="h-40 w-full rounded border-2 border-[#DBAAA6]/30 bg-[#32212C]/60" aria-label={`${title} loading`} />
      </div>
    </div>
  );
}
