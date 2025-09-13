"use client";

import CassettePass from "@/components/CassettePass";
import { useMemo } from "react";
import { useSession } from "next-auth/react";

type IncomingPass = {
  id: string;
  pass_name?: string;
  title?: string;
  description?: string | null;
  cost?: number | string | null;
  price?: number; // alternate source
};

interface FeaturesProps { passes?: IncomingPass[]; isMahe?: boolean }

const Features: React.FC<FeaturesProps> = ({ passes = [], isMahe = false }) => {
  const { data: session } = useSession();
  const sessionIsMahe = isMahe || Boolean((session?.user as { mahe?: boolean } | undefined)?.mahe);

  const normalized = useMemo(() => {
    const base = passes.map(p => ({
      id: p.id,
      pass_name: p.pass_name || p.title || "Pass",
      description: p.description ?? undefined,
      cost: p.cost ?? p.price ?? "",
    }));
    if (sessionIsMahe && !base.some(p => p.id === 'esports-pass')) {
      base.push({
        id: 'esports-pass',
        pass_name: 'Esports Pass',
        description: 'Access to all esports events & arenas.',
        cost: 99,
      });
    }
    return base;
  }, [passes, sessionIsMahe]);

  return (
    <section className="bg-transparent pb-10 relative z-10">
      <div className="container mx-auto px-3 md:px-0">
        <div className="px-5 pt-28 md:pt-36 pb-8">
          <p className="text-5xl md:text-6xl lg:text-5xl text-white text-center font-bold uppercase tracking-wider sm:mb-10 font-brasty">
            Get your Passes now!!
          </p>
        </div>
        <div className="flex flex-col gap-0">
        {normalized.map(pass => (
  <div
    key={pass.id}  
    className="flex justify-center items-center min-h-[40vh] lg:min-h-[90vh] -mt-10 sm:-mt-20 lg:-mt-40 tablet:min-h-[80vh]">
    <CassettePass pass={pass} isMahe={sessionIsMahe} />
  </div>
))}

        </div>
      </div>
    </section>
  );
};

export default Features;
